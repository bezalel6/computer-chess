/**
 * Game End Actions
 *
 * Handle end-of-game calculations, XP awards, and rank updates.
 */

'use server';

import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { calculateEndGameBonuses, calculateXPEarned, getRank } from '@/lib/economy/progression';
import type { Rank } from '@/lib/economy/progression';
import { getAIDifficultyMultiplier } from '@/lib/ai/helpers';

export interface EndGameResult {
  success: boolean;
  xpEarned?: number;
  newRank?: Rank;
  bonuses?: any;
  error?: string;
}

/**
 * Complete game and award XP/ranks
 */
export async function completeGame(
  gameId: string,
  winnerId: string | null,
  isCheckmate: boolean
): Promise<EndGameResult> {
  const session = await auth();

  if (!session || !session.user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    // Get game data
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        whitePlayer: {
          select: { id: true, username: true, rank: true, totalXP: true },
        },
        blackPlayer: {
          select: { id: true, username: true, rank: true, totalXP: true },
        },
        moves: {
          orderBy: { createdAt: 'asc' },
        },
        challengeCompletions: {
          where: { playerId: session.user.id },
        },
      },
    });

    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    const isWhite = game.whitePlayerId === session.user.id;
    const playerScore = isWhite ? game.whiteScore : game.blackScore;
    const opponentScore = isWhite ? game.blackScore : game.whiteScore;
    const opponent = isWhite ? game.blackPlayer : game.whitePlayer;

    // Calculate completion rate
    const challengesPresented = game.challengeCompletions.length;
    const challengesCompleted = game.challengeCompletions.filter((c) => c.completed).length;
    const completionRate = challengesPresented > 0 ? challengesCompleted / challengesPresented : 0;

    // Calculate bonuses
    const isWin = winnerId === session.user.id;
    const moveCount = game.moves.length;
    const pointLead = playerScore - opponentScore;

    const bonuses = calculateEndGameBonuses(
      isWin,
      isCheckmate,
      completionRate,
      moveCount,
      pointLead,
      opponent.rank as Rank,
      (isWhite ? game.whitePlayer.rank : game.blackPlayer.rank) as Rank
    );

    // Calculate XP
    let xpEarned = calculateXPEarned(playerScore, bonuses);

    // Apply AI difficulty multiplier if it's an AI game
    if (game.isAIGame && game.aiDifficulty) {
      const multiplier = getAIDifficultyMultiplier(game.aiDifficulty);
      xpEarned = Math.round(xpEarned * multiplier);
    }

    // Update user stats
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { totalXP: true, longestStreak: true, bestCombo: true },
    });

    if (!currentUser) {
      return { success: false, error: 'User not found' };
    }

    const newTotalXP = currentUser.totalXP + xpEarned;
    const newRank = getRank(newTotalXP);

    // Get longest streak and best combo from this game
    const longestStreak = Math.max(
      ...game.challengeCompletions.map((c) => c.streakCount),
      0
    );
    const bestCombo = Math.max(
      ...game.challengeCompletions.map((c) => c.comboSize),
      0
    );

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        totalXP: newTotalXP,
        rank: newRank,
        gamesPlayed: { increment: 1 },
        gamesWon: isWin ? { increment: 1 } : undefined,
        totalPoints: { increment: playerScore },
        challengesCompleted: { increment: challengesCompleted },
        longestStreak: Math.max(currentUser.longestStreak, longestStreak),
        bestCombo: Math.max(currentUser.bestCombo, bestCombo),
      },
    });

    // Create game result record
    await prisma.gameResult_V2.create({
      data: {
        gameId,
        winnerId,
        [isWhite ? 'whitePoints' : 'blackPoints']: playerScore,
        [isWhite ? 'whiteXP' : 'blackXP']: xpEarned,
        [isWhite ? 'whiteChallengesPresented' : 'blackChallengesPresented']: challengesPresented,
        [isWhite ? 'whiteChallengesCompleted' : 'blackChallengesCompleted']: challengesCompleted,
        [isWhite ? 'whiteLongestStreak' : 'blackLongestStreak']: longestStreak,
        [isWhite ? 'whiteBestCombo' : 'blackBestCombo']: bestCombo,
        [isWhite ? 'whiteCompletionRate' : 'blackCompletionRate']: completionRate,
      },
    });

    // Update game status
    await prisma.game.update({
      where: { id: gameId },
      data: {
        status: 'COMPLETED',
        endedAt: new Date(),
        winnerId,
        [isWhite ? 'whiteXpEarned' : 'blackXpEarned']: xpEarned,
      },
    });

    return {
      success: true,
      xpEarned,
      newRank,
      bonuses,
    };
  } catch (error) {
    console.error('Error completing game:', error);
    return { success: false, error: 'Failed to complete game' };
  }
}