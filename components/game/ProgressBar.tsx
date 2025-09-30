/**
 * Progress Bar Component
 *
 * Shows XP progress to next rank.
 */

'use client';

import { getProgressToNextRank, getRankInfo } from '@/lib/economy/progression';

interface ProgressBarProps {
  totalXP: number;
  showDetails?: boolean;
}

export function ProgressBar({ totalXP, showDetails = true }: ProgressBarProps) {
  const progress = getProgressToNextRank(totalXP);
  const currentRankInfo = getRankInfo(progress.nextRank ? progress.nextRank : 'WORLD_CLASS');

  if (progress.nextRank === null) {
    // Max rank
    return (
      <div className="space-y-2">
        {showDetails && (
          <div className="flex justify-between text-sm">
            <span className="font-bold text-yellow-600 dark:text-yellow-400">
              👑 World Class
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              Max Rank
            </span>
          </div>
        )}
        <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full"
            style={{ width: '100%' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {showDetails && (
        <div className="flex justify-between text-sm">
          <span className="font-semibold">
            Next: <span style={{ color: currentRankInfo.color }}>{currentRankInfo.displayName}</span>
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            {progress.current.toLocaleString()} / {progress.needed.toLocaleString()} XP
          </span>
        </div>
      )}
      <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(progress.percentage, 100)}%` }}
        />
      </div>
      {showDetails && (
        <div className="text-right text-xs text-gray-500 dark:text-gray-400">
          {progress.percentage.toFixed(1)}% complete
        </div>
      )}
    </div>
  );
}