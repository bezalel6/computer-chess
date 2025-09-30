/**
 * Progression & Economy System
 *
 * Handles XP calculations, rank progression, and bonuses.
 */

export type Rank = 'NOVICE' | 'AMATEUR' | 'CLUB_PLAYER' | 'EXPERT' | 'CANDIDATE_MASTER' | 'MASTER' | 'GRANDMASTER' | 'WORLD_CLASS';

export interface RankInfo {
  rank: Rank;
  xpRequired: number;
  displayName: string;
  color: string;
}

export const RANK_THRESHOLDS: RankInfo[] = [
  { rank: 'NOVICE', xpRequired: 0, displayName: 'Novice', color: '#9CA3AF' },
  { rank: 'AMATEUR', xpRequired: 1000, displayName: 'Amateur', color: '#10B981' },
  { rank: 'CLUB_PLAYER', xpRequired: 3000, displayName: 'Club Player', color: '#3B82F6' },
  { rank: 'EXPERT', xpRequired: 7000, displayName: 'Expert', color: '#8B5CF6' },
  { rank: 'CANDIDATE_MASTER', xpRequired: 15000, displayName: 'Candidate Master', color: '#EC4899' },
  { rank: 'MASTER', xpRequired: 30000, displayName: 'Master', color: '#F59E0B' },
  { rank: 'GRANDMASTER', xpRequired: 60000, displayName: 'Grandmaster', color: '#EF4444' },
  { rank: 'WORLD_CLASS', xpRequired: 100000, displayName: 'World Class', color: '#FCD34D' },
];

/**
 * Get current rank based on total XP
 */
export function getRank(totalXP: number): Rank {
  for (let i = RANK_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXP >= RANK_THRESHOLDS[i].xpRequired) {
      return RANK_THRESHOLDS[i].rank;
    }
  }
  return 'NOVICE';
}

/**
 * Get rank info for display
 */
export function getRankInfo(rank: Rank): RankInfo {
  return RANK_THRESHOLDS.find((r) => r.rank === rank) || RANK_THRESHOLDS[0];
}

/**
 * Get progress to next rank
 */
export function getProgressToNextRank(totalXP: number): {
  current: number;
  needed: number;
  percentage: number;
  nextRank: Rank | null;
} {
  const currentRank = getRank(totalXP);
  const currentIndex = RANK_THRESHOLDS.findIndex((r) => r.rank === currentRank);

  // Max rank reached
  if (currentIndex === RANK_THRESHOLDS.length - 1) {
    return {
      current: 0,
      needed: 0,
      percentage: 100,
      nextRank: null,
    };
  }

  const nextRank = RANK_THRESHOLDS[currentIndex + 1];
  const prevThreshold = RANK_THRESHOLDS[currentIndex].xpRequired;
  const nextThreshold = nextRank.xpRequired;
  const xpInCurrentRank = totalXP - prevThreshold;
  const xpNeededForNextRank = nextThreshold - prevThreshold;

  return {
    current: xpInCurrentRank,
    needed: xpNeededForNextRank,
    percentage: (xpInCurrentRank / xpNeededForNextRank) * 100,
    nextRank: nextRank.rank,
  };
}

/**
 * Calculate end-of-game XP bonuses
 */
export interface GameBonuses {
  winBonus: number;
  checkmateBonus: number;
  completionBonus: number;
  perfectGameBonus: number;
  comebackBonus: number;
  speedBonus: number;
  dominationBonus: number;
  opponentRankMultiplier: number;
}

export function calculateEndGameBonuses(
  isWin: boolean,
  isCheckmate: boolean,
  completionRate: number,
  moveCount: number,
  pointLead: number,
  opponentRank: Rank,
  playerRank: Rank
): GameBonuses {
  const bonuses: GameBonuses = {
    winBonus: isWin ? 50 : 0,
    checkmateBonus: isCheckmate ? 25 : 0,
    completionBonus: 0,
    perfectGameBonus: 0,
    comebackBonus: 0,
    speedBonus: 0,
    dominationBonus: 0,
    opponentRankMultiplier: 1.0,
  };

  // Completion bonuses
  if (completionRate >= 1.0) {
    bonuses.perfectGameBonus = 200;
    if (isWin) bonuses.perfectGameBonus += 150; // Flawless victory
  } else if (completionRate >= 0.9) {
    bonuses.completionBonus = 100;
  } else if (completionRate >= 0.8) {
    bonuses.completionBonus = 50;
  }

  // Speed bonus (win in under 25 moves)
  if (isWin && moveCount < 25) {
    bonuses.speedBonus = 30;
  }

  // Domination bonus (win with 150+ point lead)
  if (isWin && pointLead >= 150) {
    bonuses.dominationBonus = 75;
  }

  // Opponent rank multiplier
  const playerRankIndex = RANK_THRESHOLDS.findIndex((r) => r.rank === playerRank);
  const opponentRankIndex = RANK_THRESHOLDS.findIndex((r) => r.rank === opponentRank);
  const rankDiff = opponentRankIndex - playerRankIndex;

  if (rankDiff >= 3) bonuses.opponentRankMultiplier = 1.50;
  else if (rankDiff >= 2) bonuses.opponentRankMultiplier = 1.30;
  else if (rankDiff >= 1) bonuses.opponentRankMultiplier = 1.15;

  return bonuses;
}

/**
 * Calculate total XP earned from a game
 */
export function calculateXPEarned(
  gamePoints: number,
  bonuses: GameBonuses
): number {
  const baseBonuses = bonuses.winBonus + bonuses.checkmateBonus + bonuses.completionBonus +
                     bonuses.perfectGameBonus + bonuses.comebackBonus + bonuses.speedBonus +
                     bonuses.dominationBonus;

  const totalXP = (gamePoints + baseBonuses) * bonuses.opponentRankMultiplier;

  return Math.round(totalXP);
}

/**
 * Get streak badge name
 */
export function getStreakBadge(streakCount: number): string | null {
  if (streakCount >= 15) return '🔥 Grandmaster Streak';
  if (streakCount >= 10) return '⭐ Legendary';
  if (streakCount >= 5) return '💫 Unstoppable';
  if (streakCount >= 3) return '🎯 On Fire';
  return null;
}

/**
 * Get combo badge name
 */
export function getComboBadge(comboSize: number): string | null {
  if (comboSize >= 5) return '👑 Immortal';
  if (comboSize >= 4) return '✨ Perfect Move';
  if (comboSize >= 3) return '🏆 Triple Crown';
  if (comboSize >= 2) return '⚡ Double Threat';
  return null;
}