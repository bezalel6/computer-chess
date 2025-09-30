/**
 * Database Query Helpers
 *
 * Centralized database queries with proper error handling and type safety.
 */

import { prisma } from './prisma';
import { GameStatus, GameResult } from '@prisma/client';

/**
 * User Queries
 */
export async function getUserByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username },
  });
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
  });
}

export async function createUser(data: {
  username: string;
  email?: string;
  passwordHash?: string;
  isGuest: boolean;
}) {
  return prisma.user.create({
    data,
  });
}

export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  return !user;
}

/**
 * Game Queries
 */
export async function getGameById(gameId: string) {
  return prisma.game.findUnique({
    where: { id: gameId },
    include: {
      whitePlayer: {
        select: { id: true, username: true, isGuest: true },
      },
      blackPlayer: {
        select: { id: true, username: true, isGuest: true },
      },
      moves: {
        orderBy: { moveNumber: 'asc' },
      },
    },
  });
}

export async function createGame(data: {
  whitePlayerId: string;
  blackPlayerId: string;
  initialFen?: string;
}) {
  const initialFen = data.initialFen ?? 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  return prisma.game.create({
    data: {
      whitePlayerId: data.whitePlayerId,
      blackPlayerId: data.blackPlayerId,
      initialFen,
      currentFen: initialFen,
      status: GameStatus.IN_PROGRESS,
    },
    include: {
      whitePlayer: {
        select: { id: true, username: true, isGuest: true },
      },
      blackPlayer: {
        select: { id: true, username: true, isGuest: true },
      },
    },
  });
}

export async function updateGameFen(gameId: string, newFen: string) {
  return prisma.game.update({
    where: { id: gameId },
    data: {
      currentFen: newFen,
      lastActivityAt: new Date(),
    },
  });
}

export async function addMoveToGame(data: {
  gameId: string;
  moveNumber: number;
  from: string;
  to: string;
  promotion?: string;
  fenAfterMove: string;
  evaluationCp?: number;
}) {
  return prisma.move.create({
    data,
  });
}

export async function updateGameScore(
  gameId: string,
  whiteScore: number,
  blackScore: number
) {
  return prisma.game.update({
    where: { id: gameId },
    data: {
      whiteScore,
      blackScore,
      lastActivityAt: new Date(),
    },
  });
}

export async function endGame(data: {
  gameId: string;
  result: GameResult;
  winnerId?: string;
}) {
  return prisma.game.update({
    where: { id: data.gameId },
    data: {
      status: GameStatus.COMPLETED,
      result: data.result,
      winnerId: data.winnerId,
      endedAt: new Date(),
    },
  });
}

/**
 * Matchmaking Queries
 */
export async function addToMatchQueue(userId: string, expiresAt: Date) {
  return prisma.matchQueue.create({
    data: {
      userId,
      expiresAt,
    },
  });
}

export async function removeFromMatchQueue(userId: string) {
  return prisma.matchQueue.delete({
    where: { userId },
  }).catch(() => null); // Ignore error if not in queue
}

export async function getWaitingOpponent(excludeUserId: string) {
  // Clean up expired entries first
  await prisma.matchQueue.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  // Find first waiting player (FIFO)
  return prisma.matchQueue.findFirst({
    where: {
      userId: {
        not: excludeUserId,
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
    include: {
      user: {
        select: { id: true, username: true },
      },
    },
  });
}

/**
 * Friend Challenge Queries
 */
export async function createPendingChallenge(data: {
  challengerId: string;
  challengedId: string;
  challengerColor: string;
  expiresAt: Date;
}) {
  return prisma.pendingChallenge.create({
    data: {
      ...data,
      status: 'PENDING',
    },
  });
}

export async function getPendingChallengesForUser(userId: string) {
  // Clean up expired challenges
  await prisma.pendingChallenge.updateMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
      status: 'PENDING',
    },
    data: {
      status: 'EXPIRED',
    },
  });

  return prisma.pendingChallenge.findMany({
    where: {
      challengedId: userId,
      status: 'PENDING',
    },
    include: {
      challenger: {
        select: { id: true, username: true },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function acceptPendingChallenge(challengeId: string, gameId: string) {
  return prisma.pendingChallenge.update({
    where: { id: challengeId },
    data: {
      status: 'ACCEPTED',
      gameId,
    },
  });
}

export async function declinePendingChallenge(challengeId: string) {
  return prisma.pendingChallenge.update({
    where: { id: challengeId },
    data: {
      status: 'DECLINED',
    },
  });
}

/**
 * Challenge Result Queries
 */
export async function recordChallengeResult(data: {
  gameId: string;
  challengeId: string;
  userId: string;
  status: 'POSSIBLE' | 'SUCCESS' | 'FAIL';
  pointsAwarded: number;
  moveNumber: number;
}) {
  return prisma.challengeResult.create({
    data,
  });
}

export async function getChallengeResultsForGame(gameId: string) {
  return prisma.challengeResult.findMany({
    where: { gameId },
    include: {
      challenge: true,
      user: {
        select: { id: true, username: true },
      },
    },
    orderBy: {
      moveNumber: 'asc',
    },
  });
}