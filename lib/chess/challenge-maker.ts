/**
 * Challenge Maker
 *
 * Generates chess challenges based on position analysis using Stockfish.
 * Implements comprehensive challenge system with 15 challenge types and difficulty tiers.
 */

import { Chess, SQUARES, type Move, type Square } from 'chess.ts';
import { getStockfishManager, type MoveScore, type MovesAnalysis } from '@/lib/stockfish/worker-manager';
import type { Challenge, MoveOption, Difficulty, ChallengeType } from '@/stores/challengeStore';

// Challenge generation constants
const DIFFICULTY_THRESHOLDS = {
  EASY_MIN: 150,
  MEDIUM_MIN: 50,
  HARD_MIN: 20,
} as const;

const CP_GAIN_THRESHOLDS = {
  TACTICAL_SHOT: 300,
  QUIET_BRILLIANCY: 30,
  KNIGHT_NINJA: 25,
  BISHOP_BRILLIANCE: 30,
  ROOK_LIFT: 40,
  QUEEN_POWER: 30,
  PAWN_STORM: 20,
  KING_SAFETY: 25,
  SPACE_INVADER: 25,
} as const;

const MATE_SCORE_THRESHOLD = 10000;
const DEFENSIVE_GENIUS_CP_SWING = 200;
const EVALUATION_MASTER_CP_TOLERANCE = 10;
const HIGH_MOVE_COUNT = 35;
const LOW_MOVE_COUNT = 10;
const OPENING_MOVE_LIMIT = 10;

export class ChallengeMaker {
  private static readonly DEFAULT_DIFF = 400;
  private position: Chess;
  private moves: MovesAnalysis;
  private knightLocs: string[];
  private bishopLocs: string[];
  private rookLocs: string[];
  private queenLocs: string[];

  constructor(position: Chess, moves: MovesAnalysis) {
    this.position = position;
    this.moves = moves;
    this.knightLocs = [];
    this.bishopLocs = [];
    this.rookLocs = [];
    this.queenLocs = [];

    // Find piece positions for current player
    for (const square of Object.keys(SQUARES)) {
      const piece = this.position.get(square as Square);
      if (piece && piece.color === position.turn()) {
        if (piece.type === 'n') this.knightLocs.push(square);
        if (piece.type === 'b') this.bishopLocs.push(square);
        if (piece.type === 'r') this.rookLocs.push(square);
        if (piece.type === 'q') this.queenLocs.push(square);
      }
    }
  }

  /**
   * Calculate difficulty based on centipawn difference and position complexity
   */
  private calculateDifficulty(bestMoveEval: number, secondBestEval: number): Difficulty {
    const cpDifference = Math.abs(bestMoveEval - secondBestEval);
    const legalMoves = this.position.moves().length;
    const moveNumber = this.getMoveNumber();

    let difficulty: Difficulty;
    if (cpDifference > DIFFICULTY_THRESHOLDS.EASY_MIN) difficulty = 'Easy';
    else if (cpDifference > DIFFICULTY_THRESHOLDS.MEDIUM_MIN) difficulty = 'Medium';
    else if (cpDifference > DIFFICULTY_THRESHOLDS.HARD_MIN) difficulty = 'Hard';
    else difficulty = 'Expert';

    // Adjust for position complexity
    if (legalMoves > HIGH_MOVE_COUNT && difficulty === 'Easy') difficulty = 'Medium';
    if (legalMoves < LOW_MOVE_COUNT && difficulty === 'Hard') difficulty = 'Expert';

    // Adjust for game phase (opening moves rarely Expert)
    if (moveNumber < OPENING_MOVE_LIMIT && difficulty === 'Expert') difficulty = 'Hard';

    return difficulty;
  }

  /**
   * Get current move number from FEN
   */
  private getMoveNumber(): number {
    const fenParts = this.position.fen().split(' ');
    return fenParts[5] ? parseInt(fenParts[5]) : 1;
  }

  /**
   * Get base reward for challenge type
   */
  private getBaseReward(type: ChallengeType): number {
    const rewards: Record<ChallengeType, number> = {
      'Tactical Shot': 10,
      'Best Capture': 6,
      'Defensive Genius': 12,
      'Outpost Master': 8,
      'Center Control': 7,
      'Weak Square Exploiter': 11,
      'Evaluation Master': 9,
      'Quiet Brilliancy': 14,
      'Knight Ninja': 8,
      'Bishop Brilliance': 8,
      'Rook Lift': 10,
      'Queen Power': 7,
      'Pawn Storm': 6,
      'King Safety': 8,
      'Space Invader': 9,
      'Best Move': 9, // Legacy
      'Worst Move': 6, // Legacy
      'Best Knight Move': 8, // Legacy
    };
    return rewards[type] || 9;
  }

  /**
   * Calculate reward based on difficulty multiplier
   */
  private calculateReward(type: ChallengeType, difficulty: Difficulty): number {
    const baseReward = this.getBaseReward(type);
    const multipliers: Record<Difficulty, number> = {
      Easy: 0.5,
      Medium: 1.0,
      Hard: 1.8,
      Expert: 3.5,
    };
    return Math.round(baseReward * multipliers[difficulty]);
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
   * Helper to create a challenge object with common fields
   */
  private createChallenge(
    type: ChallengeType,
    description: string,
    correctMoves: MoveOption[],
    difficulty: Difficulty,
    challengeType: 'any option' | 'dynamic relative to best option' = 'any option'
  ): Challenge {
    const reward = this.calculateReward(type, difficulty);

    return {
      id: `${type.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      name: type,
      description,
      mandatory: 'optional',
      status: 'possible',
      ttp: 'Turn',
      reward,
      difficulty,
      checkChallenge: {
        challengeType,
        correctMoves,
      },
    };
  }

  /**
   * Helper to filter moves by piece type from specific squares
   */
  private filterMovesByPieceLocations(pieceLocations: string[]): MoveOption[] {
    return this.moves.sorted.filter((m) =>
      pieceLocations.some((loc) => m.move.substring(0, 2) === loc)
    );
  }

  /**
   * Create "Best Move" challenge
   */
  bestMove(): Challenge {
    const bestMove = this.moves.sorted[0];
    const secondBest = this.moves.sorted[1] || bestMove;
    const difficulty = this.calculateDifficulty(bestMove.cp, secondBest.cp);

    return this.createChallenge(
      'Best Move',
      'Make the best move in this position',
      [bestMove],
      difficulty
    );
  }

  /**
   * Create "Worst Move" challenge
   */
  worstMove(): Challenge {
    const worstMove = this.moves.sorted[this.moves.sorted.length - 1];
    const secondWorst = this.moves.sorted[this.moves.sorted.length - 2] || worstMove;
    const difficulty = this.calculateDifficulty(worstMove.cp, secondWorst.cp);

    return this.createChallenge(
      'Worst Move',
      'Make the worst move in this position',
      this.edgeMoves('worst'),
      difficulty,
      'dynamic relative to best option'
    );
  }

  /**
   * Create "Best Knight Move" challenge
   */
  bestKnightMove(): Challenge | null {
    if (!this.knightLocs.length) return null;

    const knightMoves = this.filterMovesByPieceLocations(this.knightLocs);
    if (knightMoves.length === 0) return null;

    const bestKnight = knightMoves[0];
    const secondBestKnight = knightMoves[1] || bestKnight;
    const difficulty = this.calculateDifficulty(bestKnight.cp, secondBestKnight.cp);

    return this.createChallenge(
      'Best Knight Move',
      'Make the best knight move in this position',
      [bestKnight],
      difficulty
    );
  }

  /**
   * 1. Tactical Shot - Find moves with CP gain >300 or mate in N
   */
  tacticalShot(): Challenge | null {
    const bestMove = this.moves.sorted[0];
    const secondBest = this.moves.sorted[1] || bestMove;

    // Check for mate
    const isMate = Math.abs(bestMove.cp) > MATE_SCORE_THRESHOLD;
    if (isMate) {
      const difficulty: Difficulty = 'Expert';
      const reward = this.calculateReward('Tactical Shot', difficulty);
      return {
        id: `tactical-shot-${Date.now()}`,
        name: 'Tactical Shot',
        description: 'Find the checkmate',
        mandatory: 'optional',
        status: 'possible',
        ttp: 'Turn',
        reward,
        difficulty,
        checkChallenge: {
          challengeType: 'any option',
          correctMoves: [bestMove],
        },
      };
    }

    // Check for tactical gain
    const cpGain = Math.abs(bestMove.cp - secondBest.cp);

    if (cpGain > CP_GAIN_THRESHOLDS.TACTICAL_SHOT) {
      const difficulty = this.calculateDifficulty(bestMove.cp, secondBest.cp);
      const reward = this.calculateReward('Tactical Shot', difficulty);

      return {
        id: `tactical-shot-${Date.now()}`,
        name: 'Tactical Shot',
        description: 'Execute a powerful tactical blow',
        mandatory: 'optional',
        status: 'possible',
        ttp: 'Turn',
        reward,
        difficulty,
        checkChallenge: {
          challengeType: 'any option',
          correctMoves: [bestMove],
        },
      };
    }

    return null;
  }

  /**
   * 2. Best Capture - Find the most valuable capture
   */
  bestCapture(): Challenge | null {
    // Filter for captures
    const captures = this.moves.sorted.filter((m) => {
      const to = m.move.substring(2, 4) as Square;
      const targetPiece = this.position.get(to);
      return targetPiece && targetPiece.color !== this.position.turn();
    });

    if (captures.length === 0) return null;

    const bestCapture = captures[0];
    const secondBestCapture = captures[1] || bestCapture;
    const difficulty = this.calculateDifficulty(bestCapture.cp, secondBestCapture.cp);

    return this.createChallenge(
      'Best Capture',
      'Make the most valuable capture',
      [bestCapture],
      difficulty
    );
  }

  /**
   * 3. Defensive Genius - Block/prevent opponent threats (CP swing >200)
   */
  defensiveGenius(): Challenge | null {
    const bestMove = this.moves.sorted[0];
    const worstMove = this.moves.sorted[this.moves.sorted.length - 1];

    // Check if position is under threat (big CP difference between best and worst)
    const cpSwing = Math.abs(bestMove.cp - worstMove.cp);

    if (cpSwing > DEFENSIVE_GENIUS_CP_SWING) {
      const secondBest = this.moves.sorted[1] || bestMove;
      const difficulty = this.calculateDifficulty(bestMove.cp, secondBest.cp);
      const reward = this.calculateReward('Defensive Genius', difficulty);

      return {
        id: `defensive-genius-${Date.now()}`,
        name: 'Defensive Genius',
        description: 'Defend against the opponent\'s threat',
        mandatory: 'optional',
        status: 'possible',
        ttp: 'Turn',
        reward,
        difficulty,
        checkChallenge: {
          challengeType: 'any option',
          correctMoves: [bestMove],
        },
      };
    }

    return null;
  }

  /**
   * 4. Outpost Master - Place piece on 5th/6th rank, defended
   */
  outpostMaster(): Challenge | null {
    const turn = this.position.turn();
    const outpostRanks = turn === 'w' ? ['5', '6'] : ['4', '3'];

    // Find moves to outpost squares
    const outpostMoves = this.moves.sorted.filter((m) => {
      const to = m.move.substring(2, 4);
      const toRank = to[1];
      const from = m.move.substring(0, 2) as Square;
      const piece = this.position.get(from);

      // Check if it's a minor piece (knight or bishop) moving to outpost rank
      return piece &&
             (piece.type === 'n' || piece.type === 'b') &&
             outpostRanks.includes(toRank);
    });

    if (outpostMoves.length === 0) return null;

    const bestOutpost = outpostMoves[0];
    const secondBestOutpost = outpostMoves[1] || bestOutpost;
    const difficulty = this.calculateDifficulty(bestOutpost.cp, secondBestOutpost.cp);
    const reward = this.calculateReward('Outpost Master', difficulty);

    return {
      id: `outpost-master-${Date.now()}`,
      name: 'Outpost Master',
      description: 'Establish a strong outpost',
      mandatory: 'optional',
      status: 'possible',
      ttp: 'Turn',
      reward,
      difficulty,
      checkChallenge: {
        challengeType: 'any option',
        correctMoves: [bestOutpost],
      },
    };
  }

  /**
   * 5. Center Control - Control center squares (d4, d5, e4, e5)
   */
  centerControl(): Challenge | null {
    const centerSquares = ['d4', 'd5', 'e4', 'e5'];

    // Find moves targeting center squares
    const centerMoves = this.moves.sorted.filter((m) => {
      const to = m.move.substring(2, 4);
      return centerSquares.includes(to);
    });

    if (centerMoves.length === 0) return null;

    const bestCenter = centerMoves[0];
    const secondBestCenter = centerMoves[1] || bestCenter;
    const difficulty = this.calculateDifficulty(bestCenter.cp, secondBestCenter.cp);
    const reward = this.calculateReward('Center Control', difficulty);

    return {
      id: `center-control-${Date.now()}`,
      name: 'Center Control',
      description: 'Control the center of the board',
      mandatory: 'optional',
      status: 'possible',
      ttp: 'Turn',
      reward,
      difficulty,
      checkChallenge: {
        challengeType: 'any option',
        correctMoves: [bestCenter],
      },
    };
  }

  /**
   * 6. Weak Square Exploiter - Target weak squares opponent can't defend with pawns
   */
  weakSquareExploiter(): Challenge | null {
    const turn = this.position.turn();
    const opponentTurn = turn === 'w' ? 'b' : 'w';

    // Find moves to squares that can't be defended by opponent pawns
    const weakSquareMoves = this.moves.sorted.filter((m) => {
      const to = m.move.substring(2, 4);
      const toFile = to[0];
      const toRank = parseInt(to[1]);

      // Check adjacent files for opponent pawns
      const adjacentFiles = [
        String.fromCharCode(toFile.charCodeAt(0) - 1),
        String.fromCharCode(toFile.charCodeAt(0) + 1),
      ];

      const pawnRank = opponentTurn === 'w' ? toRank + 1 : toRank - 1;
      const canBeDefendedByPawn = adjacentFiles.some((file) => {
        if (file < 'a' || file > 'h' || pawnRank < 1 || pawnRank > 8) return false;
        const square = `${file}${pawnRank}` as Square;
        const piece = this.position.get(square);
        return piece && piece.type === 'p' && piece.color === opponentTurn;
      });

      return !canBeDefendedByPawn;
    });

    if (weakSquareMoves.length === 0) return null;

    const bestWeak = weakSquareMoves[0];
    const secondBestWeak = weakSquareMoves[1] || bestWeak;
    const difficulty = this.calculateDifficulty(bestWeak.cp, secondBestWeak.cp);
    const reward = this.calculateReward('Weak Square Exploiter', difficulty);

    return {
      id: `weak-square-${Date.now()}`,
      name: 'Weak Square Exploiter',
      description: 'Exploit a weakness in opponent\'s pawn structure',
      mandatory: 'optional',
      status: 'possible',
      ttp: 'Turn',
      reward,
      difficulty,
      checkChallenge: {
        challengeType: 'any option',
        correctMoves: [bestWeak],
      },
    };
  }

  /**
   * 7. Evaluation Master - Within 10cp of Stockfish's top move
   */
  evaluationMaster(): Challenge | null {
    const bestMove = this.moves.sorted[0];

    // Find all moves within tolerance of best
    const goodMoves = this.moves.sorted.filter((m) => {
      return Math.abs(m.cp - bestMove.cp) <= EVALUATION_MASTER_CP_TOLERANCE;
    });

    if (goodMoves.length < 2) return null;

    const difficulty: Difficulty = 'Hard'; // Always Hard since multiple good options
    const reward = this.calculateReward('Evaluation Master', difficulty);

    return {
      id: `evaluation-master-${Date.now()}`,
      name: 'Evaluation Master',
      description: 'Find a move within 10cp of the best',
      mandatory: 'optional',
      status: 'possible',
      ttp: 'Turn',
      reward,
      difficulty,
      checkChallenge: {
        challengeType: 'dynamic relative to best option',
        correctMoves: goodMoves,
      },
    };
  }

  /**
   * 8. Quiet Brilliancy - Best non-forcing move (no capture/check), CP gain >30
   */
  quietBrilliancy(): Challenge | null {
    // Filter for quiet moves (no captures or checks)
    const quietMoves = this.moves.sorted.filter((m) => {
      const to = m.move.substring(2, 4) as Square;
      const targetPiece = this.position.get(to);

      // Not a capture
      if (targetPiece && targetPiece.color !== this.position.turn()) return false;

      // Make move and check if it gives check
      const tempGame = new Chess(this.position.fen());
      const from = m.move.substring(0, 2) as Square;
      const promotion = m.move.length > 4 ? m.move[4] : undefined;

      try {
        tempGame.move({ from, to, promotion } as Move);
        return !tempGame.inCheck();
      } catch {
        return false;
      }
    });

    if (quietMoves.length === 0) return null;

    const bestQuiet = quietMoves[0];
    const secondBestQuiet = quietMoves[1] || bestQuiet;
    const cpGain = Math.abs(bestQuiet.cp - secondBestQuiet.cp);

    if (cpGain < 30) return null;

    const difficulty = this.calculateDifficulty(bestQuiet.cp, secondBestQuiet.cp);
    const reward = this.calculateReward('Quiet Brilliancy', difficulty);

    return {
      id: `quiet-brilliancy-${Date.now()}`,
      name: 'Quiet Brilliancy',
      description: 'Find a subtle positional move',
      mandatory: 'optional',
      status: 'possible',
      ttp: 'Turn',
      reward,
      difficulty,
      checkChallenge: {
        challengeType: 'any option',
        correctMoves: [bestQuiet],
      },
    };
  }

  /**
   * 9. Knight Ninja - Best knight move with CP gain >25
   */
  knightNinja(): Challenge | null {
    if (!this.knightLocs.length) return null;

    const knightMoves = this.moves.sorted.filter((m) =>
      this.knightLocs.some((loc) => m.move.substring(0, 2) === loc)
    );

    if (knightMoves.length === 0) return null;

    const bestKnight = knightMoves[0];
    const secondBest = this.moves.sorted[1] || bestKnight;
    const cpGain = Math.abs(bestKnight.cp - secondBest.cp);

    if (cpGain < 25) return null;

    const difficulty = this.calculateDifficulty(bestKnight.cp, secondBest.cp);
    const reward = this.calculateReward('Knight Ninja', difficulty);

    return {
      id: `knight-ninja-${Date.now()}`,
      name: 'Knight Ninja',
      description: 'Execute a tactical knight maneuver',
      mandatory: 'optional',
      status: 'possible',
      ttp: 'Turn',
      reward,
      difficulty,
      checkChallenge: {
        challengeType: 'any option',
        correctMoves: [bestKnight],
      },
    };
  }

  /**
   * 10. Bishop Brilliance - Best bishop move with CP gain >30
   */
  bishopBrilliance(): Challenge | null {
    if (!this.bishopLocs.length) return null;

    const bishopMoves = this.moves.sorted.filter((m) =>
      this.bishopLocs.some((loc) => m.move.substring(0, 2) === loc)
    );

    if (bishopMoves.length === 0) return null;

    const bestBishop = bishopMoves[0];
    const secondBest = this.moves.sorted[1] || bestBishop;
    const cpGain = Math.abs(bestBishop.cp - secondBest.cp);

    if (cpGain < 30) return null;

    const difficulty = this.calculateDifficulty(bestBishop.cp, secondBest.cp);
    const reward = this.calculateReward('Bishop Brilliance', difficulty);

    return {
      id: `bishop-brilliance-${Date.now()}`,
      name: 'Bishop Brilliance',
      description: 'Find a powerful diagonal move',
      mandatory: 'optional',
      status: 'possible',
      ttp: 'Turn',
      reward,
      difficulty,
      checkChallenge: {
        challengeType: 'any option',
        correctMoves: [bestBishop],
      },
    };
  }

  /**
   * 11. Rook Lift - Creative rook move with CP gain >40
   */
  rookLift(): Challenge | null {
    if (!this.rookLocs.length) return null;

    const rookMoves = this.moves.sorted.filter((m) =>
      this.rookLocs.some((loc) => m.move.substring(0, 2) === loc)
    );

    if (rookMoves.length === 0) return null;

    const bestRook = rookMoves[0];
    const secondBest = this.moves.sorted[1] || bestRook;
    const cpGain = Math.abs(bestRook.cp - secondBest.cp);

    if (cpGain < 40) return null;

    const difficulty = this.calculateDifficulty(bestRook.cp, secondBest.cp);
    const reward = this.calculateReward('Rook Lift', difficulty);

    return {
      id: `rook-lift-${Date.now()}`,
      name: 'Rook Lift',
      description: 'Activate your rook with a creative maneuver',
      mandatory: 'optional',
      status: 'possible',
      ttp: 'Turn',
      reward,
      difficulty,
      checkChallenge: {
        challengeType: 'any option',
        correctMoves: [bestRook],
      },
    };
  }

  /**
   * 12. Queen Power - Aggressive queen move with CP gain >30
   */
  queenPower(): Challenge | null {
    if (!this.queenLocs.length) return null;

    const queenMoves = this.moves.sorted.filter((m) =>
      this.queenLocs.some((loc) => m.move.substring(0, 2) === loc)
    );

    if (queenMoves.length === 0) return null;

    const bestQueen = queenMoves[0];
    const secondBest = this.moves.sorted[1] || bestQueen;
    const cpGain = Math.abs(bestQueen.cp - secondBest.cp);

    if (cpGain < 30) return null;

    const difficulty = this.calculateDifficulty(bestQueen.cp, secondBest.cp);
    const reward = this.calculateReward('Queen Power', difficulty);

    return {
      id: `queen-power-${Date.now()}`,
      name: 'Queen Power',
      description: 'Unleash your queen\'s power',
      mandatory: 'optional',
      status: 'possible',
      ttp: 'Turn',
      reward,
      difficulty,
      checkChallenge: {
        challengeType: 'any option',
        correctMoves: [bestQueen],
      },
    };
  }

  /**
   * 13. Pawn Storm - Pawn push with CP gain >20
   */
  pawnStorm(): Challenge | null {
    // Find pawn moves
    const pawnMoves = this.moves.sorted.filter((m) => {
      const from = m.move.substring(0, 2) as Square;
      const piece = this.position.get(from);
      return piece && piece.type === 'p';
    });

    if (pawnMoves.length === 0) return null;

    const bestPawn = pawnMoves[0];
    const secondBest = this.moves.sorted[1] || bestPawn;
    const cpGain = Math.abs(bestPawn.cp - secondBest.cp);

    if (cpGain < 20) return null;

    const difficulty = this.calculateDifficulty(bestPawn.cp, secondBest.cp);
    const reward = this.calculateReward('Pawn Storm', difficulty);

    return {
      id: `pawn-storm-${Date.now()}`,
      name: 'Pawn Storm',
      description: 'Advance your pawns aggressively',
      mandatory: 'optional',
      status: 'possible',
      ttp: 'Turn',
      reward,
      difficulty,
      checkChallenge: {
        challengeType: 'any option',
        correctMoves: [bestPawn],
      },
    };
  }

  /**
   * 14. King Safety - Castling, king to safety, or attack opponent king with CP gain >25
   */
  kingSafety(): Challenge | null {
    // Check for castling moves
    const castlingMoves = this.moves.sorted.filter((m) => {
      const from = m.move.substring(0, 2) as Square;
      const to = m.move.substring(2, 4);
      const piece = this.position.get(from);

      // King moving 2 squares is castling
      return piece && piece.type === 'k' && Math.abs(from.charCodeAt(0) - to.charCodeAt(0)) === 2;
    });

    if (castlingMoves.length > 0) {
      const bestCastling = castlingMoves[0];
      const difficulty = this.calculateDifficulty(bestCastling.cp, this.moves.sorted[1]?.cp || bestCastling.cp);
      const reward = this.calculateReward('King Safety', difficulty);

      return {
        id: `king-safety-${Date.now()}`,
        name: 'King Safety',
        description: 'Castle to secure your king',
        mandatory: 'optional',
        status: 'possible',
        ttp: 'Turn',
        reward,
        difficulty,
        checkChallenge: {
          challengeType: 'any option',
          correctMoves: [bestCastling],
        },
      };
    }

    // Check for king moves
    const kingMoves = this.moves.sorted.filter((m) => {
      const from = m.move.substring(0, 2) as Square;
      const piece = this.position.get(from);
      return piece && piece.type === 'k';
    });

    if (kingMoves.length === 0) return null;

    const bestKing = kingMoves[0];
    const secondBest = this.moves.sorted[1] || bestKing;
    const cpGain = Math.abs(bestKing.cp - secondBest.cp);

    if (cpGain < 25) return null;

    const difficulty = this.calculateDifficulty(bestKing.cp, secondBest.cp);
    const reward = this.calculateReward('King Safety', difficulty);

    return {
      id: `king-safety-${Date.now()}`,
      name: 'King Safety',
      description: 'Improve your king\'s safety',
      mandatory: 'optional',
      status: 'possible',
      ttp: 'Turn',
      reward,
      difficulty,
      checkChallenge: {
        challengeType: 'any option',
        correctMoves: [bestKing],
      },
    };
  }

  /**
   * 15. Space Invader - Restrict opponent mobility, CP gain >25
   */
  spaceInvader(): Challenge | null {
    const bestMove = this.moves.sorted[0];
    const secondBest = this.moves.sorted[1] || bestMove;
    const cpGain = Math.abs(bestMove.cp - secondBest.cp);

    if (cpGain < 25) return null;

    // Check if move restricts opponent (reduces their legal moves)
    const tempGame = new Chess(this.position.fen());
    const from = bestMove.move.substring(0, 2) as Square;
    const to = bestMove.move.substring(2, 4) as Square;
    const promotion = bestMove.move.length > 4 ? bestMove.move[4] : undefined;

    const currentOpponentMoves = tempGame.moves().length;

    try {
      tempGame.move({ from, to, promotion } as Move);
      const newOpponentMoves = tempGame.moves().length;

      // Move restricts opponent if they have fewer moves after
      if (newOpponentMoves < currentOpponentMoves - 2) {
        const difficulty = this.calculateDifficulty(bestMove.cp, secondBest.cp);
        const reward = this.calculateReward('Space Invader', difficulty);

        return {
          id: `space-invader-${Date.now()}`,
          name: 'Space Invader',
          description: 'Restrict your opponent\'s mobility',
          mandatory: 'optional',
          status: 'possible',
          ttp: 'Turn',
          reward,
          difficulty,
          checkChallenge: {
            challengeType: 'any option',
            correctMoves: [bestMove],
          },
        };
      }
    } catch {
      return null;
    }

    return null;
  }

  /**
   * Generate all available challenges for this position
   */
  make(): Challenge[] {
    const allChallenges: (Challenge | null)[] = [
      this.tacticalShot(),
      this.bestCapture(),
      this.defensiveGenius(),
      this.outpostMaster(),
      this.centerControl(),
      this.weakSquareExploiter(),
      this.evaluationMaster(),
      this.quietBrilliancy(),
      this.knightNinja(),
      this.bishopBrilliance(),
      this.rookLift(),
      this.queenPower(),
      this.pawnStorm(),
      this.kingSafety(),
      this.spaceInvader(),
    ];

    // Filter out null challenges
    const availableChallenges = allChallenges.filter((c): c is Challenge => c !== null);

    // If we have more than 5 legal moves, always include Evaluation Master
    if (this.position.moves().length > 5) {
      const evalMaster = this.evaluationMaster();
      if (evalMaster && !availableChallenges.some((c) => c.name === 'Evaluation Master')) {
        availableChallenges.push(evalMaster);
      }
    }

    // Shuffle and select 2-4 diverse challenges
    const shuffled = availableChallenges.sort(() => Math.random() - 0.5);
    const selectedCount = Math.min(Math.max(2, Math.floor(Math.random() * 3) + 2), shuffled.length);

    return shuffled.slice(0, selectedCount);
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
    return maker.make();
  } catch (error) {
    console.error('Error creating challenges:', error);
    return [];
  }
}