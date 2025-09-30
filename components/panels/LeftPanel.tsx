/**
 * Left Panel Component
 *
 * Displays current challenges and game log.
 */

'use client';

import { useChallengeStore } from '@/stores/challengeStore';
import { useGameStore } from '@/stores/gameStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChallengeCard } from '@/components/game/ChallengeCard';
import { StreakDisplay } from '@/components/game/StreakDisplay';

export function LeftPanel() {
  const challenges = useChallengeStore((state) => state.challenges);
  const streakCount = useChallengeStore((state) => state.streakCount);
  const currentGamePoints = useChallengeStore((state) => state.currentGamePoints);

  return (
    <div className="w-full lg:w-80 space-y-4">
      {/* Score & Streak Display */}
      <Card>
        <CardHeader>
          <CardTitle>Your Score</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {currentGamePoints} pts
          </div>
          {streakCount > 0 && <StreakDisplay />}
        </CardContent>
      </Card>

      {/* Current Challenges */}
      <Card>
        <CardHeader>
          <CardTitle>Current Challenges</CardTitle>
        </CardHeader>
        <CardContent>
          {challenges.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              Make a move to see challenges
            </p>
          ) : (
            <div className="space-y-2">
              {challenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} compact />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Move History */}
      <Card>
        <CardHeader>
          <CardTitle>Move Log</CardTitle>
        </CardHeader>
        <CardContent>
          <MoveHistory />
        </CardContent>
      </Card>
    </div>
  );
}

function MoveHistory() {
  const moves = useGameStore((state) => state.moves);

  if (moves.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-4">
        No moves yet
      </p>
    );
  }

  return (
    <div className="max-h-60 overflow-y-auto space-y-1">
      {moves.map((move, index) => (
        <div
          key={index}
          className="text-sm flex items-center gap-2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <span className="text-gray-500 w-8">{Math.floor(index / 2) + 1}.</span>
          <span className="font-mono">
            {move.from}→{move.to}
            {move.promotion && `=${move.promotion.toUpperCase()}`}
          </span>
        </div>
      ))}
    </div>
  );
}