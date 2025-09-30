/**
 * Type Definitions for Computer Chess Application
 */

import { Game, User, Move as PrismaMove, GameStatus, GameResult, ChallengeType, ChallengeStatus } from '@prisma/client';

// Re-export Prisma enums
export { GameStatus, GameResult, ChallengeType, ChallengeStatus };

// User types
export interface User {
  id: string;
  username: string;
  isGuest: boolean;
  createdAt: Date;
}

export interface SessionUser extends User {
  email?: string;
}

// Game types
export interface GameWithPlayers extends Game {
  whitePlayer: Pick<User, 'id' | 'username' | 'isGuest'>;
  blackPlayer: Pick<User, 'id' | 'username' | 'isGuest'>;
  moves?: Move[];
}

export interface Match {
  white: string; // username
  black: string; // username
}

export interface Score {
  myScore: number;
  opponentScore: number;
}

// Move types
export interface Move {
  from: string; // e.g., "e2"
  to: string;   // e.g., "e4"
  promotion?: string; // e.g., "q"
}

export interface MoveWithDetails extends Move {
  id: string;
  moveNumber: number;
  fenAfterMove: string;
  evaluationCp?: number;
  createdAt: Date;
}

// Challenge types
export interface Challenge {
  id: string;
  name: string;
  description: string;
  challengeType: ChallengeType;
  status: ChallengeStatus;
  checkChallenge: ChallengeTerms;
  pointsAwarded: number;
}

export interface ChallengeTerms {
  challengeType: 'any option' | 'dynamic relative to best option';
  correctMoves: MoveOption[];
}

export interface MoveOption {
  move: string; // e.g., "e2e4"
  cp: number;   // Centipawn evaluation
}

// Connection types
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

// Server Action result types
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: ErrorCode };

export enum ErrorCode {
  // Auth errors
  INVALID_CREDENTIALS = 'auth/invalid-credentials',
  USERNAME_TAKEN = 'auth/username-taken',
  WEAK_PASSWORD = 'auth/weak-password',
  SESSION_EXPIRED = 'auth/session-expired',
  INVALID_USERNAME = 'auth/invalid-username',

  // Game errors
  GAME_NOT_FOUND = 'game/not-found',
  NOT_YOUR_TURN = 'game/not-your-turn',
  ILLEGAL_MOVE = 'game/illegal-move',
  GAME_ALREADY_ENDED = 'game/already-ended',
  NOT_PARTICIPANT = 'game/not-participant',

  // Matchmaking errors
  ALREADY_IN_QUEUE = 'matchmaking/already-in-queue',
  FRIEND_NOT_FOUND = 'matchmaking/friend-not-found',
  FRIEND_ALREADY_IN_GAME = 'matchmaking/friend-busy',
  CANNOT_CHALLENGE_SELF = 'matchmaking/cannot-challenge-self',

  // System errors
  INTERNAL_ERROR = 'system/internal-error',
  RATE_LIMITED = 'system/rate-limited',
  NETWORK_ERROR = 'system/network-error',
  VALIDATION_ERROR = 'system/validation-error',
}

// WebSocket event types
export interface ServerToClientEvents {
  'game:started': (data: { gameId: string; match: Match }) => void;
  'game:move': (data: { move: Move; fenAfterMove: string }) => void;
  'game:ended': (data: { result: GameResult; finalScores: Score }) => void;
  'challenge:updated': (data: { challengeId: string; status: ChallengeStatus }) => void;
  'score:updated': (data: { whiteScore: number; blackScore: number }) => void;
  'player:disconnected': () => void;
  'player:reconnected': () => void;
  'error': (data: { message: string; code?: string }) => void;
}

export interface ClientToServerEvents {
  'game:join': (gameId: string) => void;
  'game:leave': (gameId: string) => void;
  'move:make': (data: Move) => void;
  'game:resign': () => void;
  'challenge:accept': (challengeId: string) => void;
}