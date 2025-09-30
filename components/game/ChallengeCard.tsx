/**
 * Challenge Card Component
 *
 * Displays a single challenge with difficulty, reward, and status.
 */

'use client';

import type { Challenge } from '@/stores/challengeStore';

interface ChallengeCardProps {
  challenge: Challenge;
  compact?: boolean;
}

const difficultyColors = {
  Easy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  Medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  Hard: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  Expert: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const statusIcons = {
  possible: '⏳',
  success: '✅',
  fail: '❌',
};

export function ChallengeCard({ challenge, compact = false }: ChallengeCardProps) {
  const difficultyColor = difficultyColors[challenge.difficulty];
  const statusIcon = statusIcons[challenge.status];

  if (compact) {
    return (
      <div
        className={`p-2 rounded border ${
          challenge.status === 'success'
            ? 'border-green-500 bg-green-50 dark:bg-green-950'
            : challenge.status === 'fail'
            ? 'border-gray-300 bg-gray-50 dark:bg-gray-900 opacity-50'
            : 'border-gray-300 dark:border-gray-700'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">{statusIcon} {challenge.name}</span>
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
            +{challenge.reward}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-4 rounded-lg border-2 transition-all ${
        challenge.status === 'success'
          ? 'border-green-500 bg-green-50 dark:bg-green-950 shadow-lg'
          : challenge.status === 'fail'
          ? 'border-gray-300 bg-gray-50 dark:bg-gray-900 opacity-50'
          : 'border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{statusIcon}</span>
          <h3 className="text-lg font-bold">{challenge.name}</h3>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`px-2 py-1 rounded text-xs font-bold ${difficultyColor}`}>
            {challenge.difficulty}
          </span>
          <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
            +{challenge.reward} pts
          </span>
        </div>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400">
        {challenge.description}
      </p>

      {challenge.status === 'success' && (
        <div className="mt-2 text-xs font-semibold text-green-600 dark:text-green-400">
          ✨ Challenge Completed!
        </div>
      )}

      {challenge.status === 'fail' && (
        <div className="mt-2 text-xs font-semibold text-gray-500">
          Challenge Failed
        </div>
      )}
    </div>
  );
}