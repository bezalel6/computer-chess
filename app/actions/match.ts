/**
 * Match Server Actions
 *
 * Handles matchmaking, move submission, and game state management.
 */

'use server';

import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';
import {
  triggerMove,
  triggerScoreUpdate,
  triggerMatchStart,
  triggerChallenge,
} from '@/lib/realtime/pusher-server';

export interface MatchResult {
  success: boolean;
  match?: {
    id: string;
    white: string;
    black: string;
    fen: string;
  };
  error?: string;
}

export interface MoveResult {
  success: boolean;
  error?: string;
}

/**
 * Find a random match from the queue
 */
export async function findRandomMatch(): Promise<MatchResult> {
  const session = await auth();

  if (!session || !session.user) {
    return { success: false, error: 'Not authenticated' };
  }

  const userId = session.user.id;

  try {
    // Check if user is already in a queue
    const existingQueue = await prisma.matchQueue.findUnique({
      where: { userId },
    });

    if (existingQueue) {
      // Remove from queue if it's been more than 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (existingQueue.createdAt < fiveMinutesAgo) {
        await prisma.matchQueue.delete({
          where: { id: existingQueue.id },
        });
      } else {
        return { success: false, error: 'Already in matchmaking queue' };
      }
    }

    // Look for an opponent in the queue
    const opponent = await prisma.matchQueue.findFirst({
      where: {
        userId: { not: userId },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (opponent) {
      // Match found! Create a game
      const randomizeColors = Math.random() < 0.5;
      const whiteUserId = randomizeColors ? userId : opponent.userId;
      const blackUserId = randomizeColors ? opponent.userId : userId;

      // Get usernames
      const whiteUser = await prisma.user.findUnique({
        where: { id: whiteUserId },
        select: { name: true },
      });

      const blackUser = await prisma.user.findUnique({
        where: { id: blackUserId },
        select: { name: true },
      });

      if (!whiteUser || !blackUser) {
        return { success: false, error: 'User not found' };
      }

      // Create game
      const game = await prisma.game.create({
        data: {
          whitePlayerId: whiteUserId,
          blackPlayerId: blackUserId,
          status: 'active',
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        },
      });

      // Remove both players from queue
      await prisma.matchQueue.deleteMany({
        where: {
          OR: [{ userId }, { userId: opponent.userId }],
        },
      });

      // Trigger real-time match start event
      try {
        await triggerMatchStart(game.id, {
          id: game.id,
          white: whiteUser.name || 'White',
          black: blackUser.name || 'Black',
          whitePlayerId: whiteUserId,
          blackPlayerId: blackUserId,
          fen: game.fen,
        });
      } catch (error) {
        console.error('Error triggering match start:', error);
        // Continue anyway - match was created successfully
      }

      return {
        success: true,
        match: {
          id: game.id,
          white: whiteUser.name || 'White',
          black: blackUser.name || 'Black',
          fen: game.fen,
        },
      };
    } else {
      // No opponent found, add to queue (expires in 5 minutes)
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      await prisma.matchQueue.create({
        data: {
          userId,
          expiresAt,
        },
      });

      return { success: false, error: 'Waiting for opponent...' };
    }
  } catch (error) {
    console.error('Error finding match:', error);
    return { success: false, error: 'Failed to find match' };
  }
}

/**
 * Challenge a specific user
 */
export async function challengeUser(targetUsername: string): Promise<MatchResult> {
  const session = await auth();

  if (!session || !session.user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    // Find target user
    const targetUser = await prisma.user.findUnique({
      where: { name: targetUsername },
    });

    if (!targetUser) {
      return { success: false, error: 'User not found' };
    }

    if (targetUser.id === session.user.id) {
      return { success: false, error: 'Cannot challenge yourself' };
    }

    // Create pending challenge
    const challenge = await prisma.pendingChallenge.create({
      data: {
        challengerId: session.user.id,
        challengedId: targetUser.id,
      },
    });

    // Trigger real-time challenge notification
    try {
      await triggerChallenge(targetUser.id, {
        id: challenge.id,
        challengerName: session.user.name || 'Unknown',
        challengerId: session.user.id,
      });
    } catch (error) {
      console.error('Error triggering challenge:', error);
      // Continue anyway - challenge was created successfully
    }

    return {
      success: true,
      error: `Challenge sent to ${targetUsername}. Waiting for acceptance...`,
    };
  } catch (error) {
    console.error('Error challenging user:', error);
    return { success: false, error: 'Failed to send challenge' };
  }
}

/**
 * Submit a move
 */
export async function submitMove(
  gameId: string,
  move: { from: string; to: string; promotion?: string },
  newFen: string
): Promise<MoveResult> {
  const session = await auth();

  if (!session || !session.user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    // Verify game exists and user is a player
    const game = await prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    if (
      game.whitePlayerId !== session.user.id &&
      game.blackPlayerId !== session.user.id
    ) {
      return { success: false, error: 'You are not a player in this game' };
    }

    if (game.status !== 'active') {
      return { success: false, error: 'Game is not active' };
    }

    // Record the move
    await prisma.move.create({
      data: {
        gameId,
        from: move.from,
        to: move.to,
        promotion: move.promotion || null,
        fen: newFen,
      },
    });

    // Update game FEN
    await prisma.game.update({
      where: { id: gameId },
      data: { fen: newFen },
    });

    // Trigger real-time move event for opponent
    try {
      await triggerMove(gameId, move, newFen);
    } catch (error) {
      console.error('Error triggering move:', error);
      // Continue anyway - move was saved successfully
    }

    revalidatePath(`/game/${gameId}`);

    return { success: true };
  } catch (error) {
    console.error('Error submitting move:', error);
    return { success: false, error: 'Failed to submit move' };
  }
}

/**
 * Update player score
 */
export async function updateScore(
  gameId: string,
  points: number
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();

  if (!session || !session.user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    // In a real implementation, you'd update the player's total score
    // For now, this is just a placeholder
    console.log(`User ${session.user.id} scored ${points} points in game ${gameId}`);

    // Trigger real-time score update for opponent
    try {
      await triggerScoreUpdate(gameId, session.user.id, points);
    } catch (error) {
      console.error('Error triggering score update:', error);
      // Continue anyway
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating score:', error);
    return { success: false, error: 'Failed to update score' };
  }
}

/**
 * Leave matchmaking queue
 */
export async function leaveQueue(): Promise<{ success: boolean; error?: string }> {
  const session = await auth();

  if (!session || !session.user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    await prisma.matchQueue.deleteMany({
      where: { userId: session.user.id },
    });

    return { success: true };
  } catch (error) {
    console.error('Error leaving queue:', error);
    return { success: false, error: 'Failed to leave queue' };
  }
}