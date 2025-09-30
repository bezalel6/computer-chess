/**
 * Challenge Maker
 *
 * Generates chess challenges based on position analysis using Stockfish.
 */

import { Chess, Square, SQUARES } from 'chess.ts';
import { getStockfishManager, type MoveScore, type MovesAnalysis } from '@/lib/stockfish/worker-manager';
import type { Challenge, MoveOption } from '@/stores/challengeStore';

export class ChallengeMaker {
  private static readonly DEFAULT_DIFF = 400;
  private position: Chess;
  private moves: MovesAnalysis;
  private knightLocs: string[];

  constructor(position: Chess, moves: MovesAnalysis) {
    this.position = position;
    this.moves = moves;
    this.knightLocs = [];

    // Find knight positions
    for (const square of Object.keys(SQUARES)) {
      const piece = this.position.get(square as Square);
      if (piece && piece.color === position.turn() && piece.type === 'n') {
        this.knightLocs.push(square);
      }
    }
  }

  /**
   * Get edge moves (best or worst) within a centipawn difference
   */
  private edgeMoves(edge: 'best' | 'worst', maxDifference?: number): MoveOption[] {
    const best = this.moves.sorted[edge === 'best' ? 0 : this.moves.sorted.length - 1];
    const diff = maxDifference === undefined ? ChallengeMaker.DEFAULT_DIFF : maxDifference;

    return this.moves.sorted.filter((m) => {
      return m.cp * best.cp >= 0 && Math.abs(m.cp - best.cp) <= diff;
    });
  }

  /**
   * Create "Best Move" challenge
   */
  bestMove(): Challenge {
    const bestMove = this.moves.sorted[0];

    return {
      id: `best-move-${Date.now()}`,
      name: 'Best Move',
      description: 'Make the best move in this position',
      mandatory: 'optional',
      status: 'possible',
      ttp: 'Turn',
      reward: 10,
      checkChallenge: {
        challengeType: 'any option',
        correctMoves: [bestMove],
      },
    };
  }

  /**
   * Create "Worst Move" challenge
   */
  worstMove(): Challenge {
    return {
      id: `worst-move-${Date.now()}`,
      name: 'Worst Move',
      description: 'Make the worst move in this position',
      mandatory: 'optional',
      status: 'possible',
      ttp: 'Turn',
      reward: 10,
      checkChallenge: {
        challengeType: 'dynamic relative to best option',
        correctMoves: this.edgeMoves('worst'),
      },
    };
  }

  /**
   * Create "Best Knight Move" challenge
   */
  bestKnightMove(): Challenge | null {
    if (!this.knightLocs.length) return null;

    // Find best knight move
    const knightMoves = this.moves.sorted.filter((m) =>
      this.knightLocs.some((loc) => m.move.substring(0, 2) === loc)
    );

    if (knightMoves.length === 0) return null;

    return {
      id: `best-knight-move-${Date.now()}`,
      name: 'Best Knight Move',
      description: 'Make the best knight move in this position',
      mandatory: 'optional',
      status: 'possible',
      ttp: 'Turn',
      reward: 15,
      checkChallenge: {
        challengeType: 'any option',
        correctMoves: [knightMoves[0]],
      },
    };
  }

  /**
   * Generate all available challenges for this position
   */
  make(): Challenge[] {
    const challenges: Challenge[] = [];

    // Add standard challenges
    challenges.push(this.bestMove());
    challenges.push(this.worstMove());

    // Add knight challenge if available
    const knightChallenge = this.bestKnightMove();
    if (knightChallenge) {
      challenges.push(knightChallenge);
    }

    return challenges;
  }
}

/**
 * Generate challenges for a chess position
 */
export async function createChallenges(chess: Chess): Promise<Challenge[]> {
  const stockfish = getStockfishManager();

  try {
    // Get all legal moves
    const legalMoves = chess.moves({ verbose: true });
    if (legalMoves.length === 0) {
      return [];
    }

    // Analyze each move
    const fen = chess.fen();
    const moves: MovesAnalysis = {
      moves: new Map(),
      sorted: [],
    };

    // Analyze moves in parallel (limit to avoid overwhelming the system)
    const BATCH_SIZE = 5;
    for (let i = 0; i < legalMoves.length; i += BATCH_SIZE) {
      const batch = legalMoves.slice(i, i + BATCH_SIZE);
      const promises = batch.map(async (move) => {
        const moveStr = move.from + move.to + (move.promotion || '');
        try {
          const analysis = await stockfish.analyzeMove(fen, moveStr, 100);
          moves.moves.set(moveStr, analysis);
        } catch (error) {
          console.warn(`Failed to analyze move ${moveStr}:`, error);
          // Add with neutral evaluation if analysis fails
          moves.moves.set(moveStr, { move: moveStr, cp: 0 });
        }
      });

      await Promise.all(promises);
    }

    // Sort moves by evaluation
    moves.sorted = Array.from(moves.moves.values()).sort((a, b) => b.cp - a.cp);

    // Create challenges
    const maker = new ChallengeMaker(chess, moves);
    const allChallenges = maker.make();

    // Return one random challenge (as in original implementation)
    if (allChallenges.length > 0) {
      const randomIndex = Math.floor(Math.random() * allChallenges.length);
      return [allChallenges[randomIndex]];
    }

    return [];
  } catch (error) {
    console.error('Error creating challenges:', error);
    return [];
  }
}