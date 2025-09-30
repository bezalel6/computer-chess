/**
 * AI Game Helpers
 *
 * Utility functions for AI games (non-server-action helpers).
 */

import type { AIDifficulty } from '@prisma/client';

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