/**
 * AI Game Server Actions
 *
 * Handles AI opponent game creation and move generation.
 */

'use server';

import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { Chess } from 'chess.ts';
import { getStockfishManager, type AIDifficulty } from '@/lib/stockfish/worker-manager';

export type { AIDifficulty };

export interface AIGameResult {
  success: boolean;
  game?: {
    id: string;
    playerColor: 'white' | 'black';
    aiDifficulty: AIDifficulty;
    fen: string;
  };
  error?: string;
}

export interface AIMoveResult {
  success: boolean;
  move?: {
    from: string;
    to: string;
    promotion?: string;
  };
  newFen?: string;
  error?: string;
}

/**
 * Get XP multiplier for AI difficulty
 */
export function getAIDifficultyMultiplier(difficulty: AIDifficulty): number {
  const multipliers: Record<AIDifficulty, number> = {
    BEGINNER: 0.5,
    INTERMEDIATE: 0.75,
    ADVANCED: 1.0,
    MASTER: 1.25,
  };
  return multipliers[difficulty];
}

/**
 * Get AI opponent display name
 */
export function getAIOpponentName(difficulty: AIDifficulty): string {
  const names: Record<AIDifficulty, string> = {
    BEGINNER: '🤖 AI Rookie (800)',
    INTERMEDIATE: '🤖 AI Player (1200)',
    ADVANCED: '🤖 AI Expert (1800)',
    MASTER: '🤖 AI Grandmaster (2400)',
  };
  return names[difficulty];
}

/**
 * Start a new AI game
 */
export async function startAIGame(
  difficulty: AIDifficulty,
  playerColor: 'white' | 'black' = 'white'
): Promise<AIGameResult> {
  const session = await auth();

  if (!session || !session.user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const userId = session.user.id;
    const initialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

    // Create game with player and AI
    const game = await prisma.game.create({
      data: {
        whitePlayerId: playerColor === 'white' ? userId : userId, // Use same user for both for now
        blackPlayerId: playerColor === 'black' ? userId : userId,
        status: 'IN_PROGRESS',
        initialFen,
        currentFen: initialFen,
        isAIGame: true,
        aiDifficulty: difficulty,
        playerColor,
      },
    });

    // If AI plays white, make first move
    if (playerColor === 'black') {
      try {
        const stockfish = getStockfishManager();
        const aiMoveStr = await stockfish.getAIMove(initialFen, difficulty);

        if (aiMoveStr) {
          // Apply AI move to get new position
          const chess = new Chess(initialFen);
          const from = aiMoveStr.substring(0, 2);
          const to = aiMoveStr.substring(2, 4);
          const promotion = aiMoveStr.length > 4 ? aiMoveStr[4] : undefined;

          chess.move({ from, to, promotion } as any);
          const newFen = chess.fen();

          // Record AI's first move
          await prisma.move.create({
            data: {
              gameId: game.id,
              from,
              to,
              promotion: promotion || null,
              fenAfterMove: newFen,
              moveNumber: 1,
            },
          });

          await prisma.game.update({
            where: { id: game.id },
            data: { currentFen: newFen },
          });

          return {
            success: true,
            game: {
              id: game.id,
              playerColor,
              aiDifficulty: difficulty,
              fen: newFen,
            },
          };
        }
      } catch (aiError) {
        console.error('AI first move failed:', aiError);
        // Continue with initial position if AI fails
      }
    }

    return {
      success: true,
      game: {
        id: game.id,
        playerColor,
        aiDifficulty: difficulty,
        fen: initialFen,
      },
    };
  } catch (error) {
    console.error('Error starting AI game:', error);
    return { success: false, error: 'Failed to start AI game' };
  }
}

/**
 * Get AI's move for current position
 */
export async function getAIMove(gameId: string): Promise<AIMoveResult> {
  const session = await auth();

  if (!session || !session.user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: {
        id: true,
        currentFen: true,
        isAIGame: true,
        aiDifficulty: true,
        status: true,
        moves: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    if (!game.isAIGame || !game.aiDifficulty) {
      return { success: false, error: 'Not an AI game' };
    }

    if (game.status !== 'IN_PROGRESS') {
      return { success: false, error: 'Game is not active' };
    }

    // Get AI move using Stockfish
    const stockfish = getStockfishManager();
    const aiMoveStr = await stockfish.getAIMove(game.currentFen, game.aiDifficulty);

    if (!aiMoveStr) {
      return { success: false, error: 'AI failed to generate move' };
    }

    // Parse move
    const from = aiMoveStr.substring(0, 2);
    const to = aiMoveStr.substring(2, 4);
    const promotion = aiMoveStr.length > 4 ? aiMoveStr[4] : undefined;

    // Apply move to get new FEN
    const chess = new Chess(game.currentFen);
    chess.move({ from, to, promotion } as any);
    const newFen = chess.fen();

    // Record AI move
    const moveNumber = game.moves.length > 0 ? game.moves[0].moveNumber + 1 : 1;

    await prisma.move.create({
      data: {
        gameId,
        from,
        to,
        promotion: promotion || null,
        fenAfterMove: newFen,
        moveNumber,
      },
    });

    // Update game position
    await prisma.game.update({
      where: { id: gameId },
      data: {
        currentFen: newFen,
        lastActivityAt: new Date(),
      },
    });

    return {
      success: true,
      move: {
        from,
        to,
        promotion,
      },
      newFen,
    };
  } catch (error) {
    console.error('Error getting AI move:', error);
    return { success: false, error: 'Failed to get AI move' };
  }
}

/**
 * Get AI game info
 */
export async function getAIGameInfo(gameId: string) {
  const session = await auth();

  if (!session || !session.user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: {
        id: true,
        isAIGame: true,
        aiDifficulty: true,
        playerColor: true,
        currentFen: true,
        status: true,
        whiteScore: true,
        blackScore: true,
      },
    });

    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    return {
      success: true,
      game: {
        ...game,
        aiOpponentName: game.aiDifficulty ? getAIOpponentName(game.aiDifficulty) : 'AI',
        xpMultiplier: game.aiDifficulty ? getAIDifficultyMultiplier(game.aiDifficulty) : 1.0,
      },
    };
  } catch (error) {
    console.error('Error getting AI game info:', error);
    return { success: false, error: 'Failed to get game info' };
  }
}