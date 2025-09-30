/**
 * Left Panel Component
 *
 * Displays current challenges and game log.
 */

'use client';

import { useChallengeStore, type Challenge } from '@/stores/challengeStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

export function LeftPanel() {
  const challenges = useChallengeStore((state) => state.challenges);

  return (
    <div className="w-full lg:w-80 space-y-4">
      {/* Current Challenges */}
      <Card>
        <CardHeader>
          <CardTitle>Current Challenges</CardTitle>
        </CardHeader>
        <CardContent>
          {challenges.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No active challenges
            </p>
          ) : (
            <div className="space-y-3">
              {challenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
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

function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const getStatusIcon = () => {
    switch (challenge.status) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'fail':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'possible':
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = () => {
    switch (challenge.status) {
      case 'success':
        return 'border-green-500 bg-green-500/10';
      case 'fail':
        return 'border-red-500 bg-red-500/10';
      case 'possible':
        return 'border-yellow-500 bg-yellow-500/10';
    }
  };

  return (
    <div
      className={`border rounded-lg p-3 transition-colors ${getStatusColor()}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{getStatusIcon()}</div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm">{challenge.name}</h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {challenge.description}
          </p>
          {challenge.reward > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Reward: {challenge.reward} points
            </p>
          )}
        </div>
      </div>
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

// Import gameStore at the bottom to avoid circular deps
import { useGameStore } from '@/stores/gameStore';