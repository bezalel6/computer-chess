/**
 * Streak Display Component
 *
 * Shows current challenge completion streak with visual flair.
 */

'use client';

import { useChallengeStore } from '@/stores/challengeStore';
import { getStreakBadge } from '@/lib/economy/progression';

export function StreakDisplay() {
  const streakCount = useChallengeStore((state) => state.streakCount);
  const badge = getStreakBadge(streakCount);

  if (streakCount === 0) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg shadow-lg animate-pulse">
      <span className="text-2xl">🔥</span>
      <div className="flex flex-col">
        <span className="text-white font-bold text-lg">
          {streakCount} Streak
        </span>
        {badge && (
          <span className="text-white text-xs font-semibold">
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}