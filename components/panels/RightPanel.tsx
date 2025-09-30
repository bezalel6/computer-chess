/**
 * Right Panel Component
 *
 * Displays player info, scores, and matchmaking controls.
 */

'use client';

import { useSession } from 'next-auth/react';
import { useGameStore } from '@/stores/gameStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Trophy, Bot } from 'lucide-react';
import { useState } from 'react';
import { getAIOpponentName, getAIDifficultyMultiplier } from '@/lib/ai/helpers';
import type { AIDifficulty } from '@prisma/client';

interface RightPanelProps {
  onFindMatch?: () => void;
  onChallengeUser?: (username: string) => void;
  onPlayAI?: () => void;
  isAIGame?: boolean;
  aiDifficulty?: AIDifficulty | null;
}

export function RightPanel({ onFindMatch, onChallengeUser, onPlayAI, isAIGame, aiDifficulty }: RightPanelProps) {
  const { data: session } = useSession();
  const isPlaying = useGameStore((state) => state.isPlaying);
  const currentMatch = useGameStore((state) => state.currentMatch);
  const score = useGameStore((state) => state.score);
  const orientation = useGameStore((state) => state.orientation);

  const [challengeUsername, setChallengeUsername] = useState('');
  const [showChallenge, setShowChallenge] = useState(false);

  const opponentUsername = currentMatch
    ? orientation === 'white'
      ? currentMatch.black
      : currentMatch.white
    : null;

  const myUsername = session?.user?.username || 'Guest';

  const handleFindMatch = () => {
    if (onFindMatch) {
      onFindMatch();
    }
  };

  const handleChallengeUser = () => {
    if (challengeUsername && onChallengeUser) {
      onChallengeUser(challengeUsername);
      setChallengeUsername('');
      setShowChallenge(false);
    }
  };

  return (
    <div className="w-full lg:w-80 space-y-4">
      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {myUsername}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Game Status */}
      {isPlaying && currentMatch ? (
        <GameStatus
          myUsername={myUsername}
          opponentUsername={opponentUsername || 'Unknown'}
          myScore={score.myScore}
          opponentScore={score.opponentScore}
          orientation={orientation}
          isAIGame={isAIGame}
          aiDifficulty={aiDifficulty}
        />
      ) : (
        <MatchmakingControls
          onFindMatch={handleFindMatch}
          onChallengeUser={handleChallengeUser}
          onPlayAI={onPlayAI}
          challengeUsername={challengeUsername}
          setChallengeUsername={setChallengeUsername}
          showChallenge={showChallenge}
          setShowChallenge={setShowChallenge}
        />
      )}
    </div>
  );
}

function GameStatus({
  myUsername,
  opponentUsername,
  myScore,
  opponentScore,
  orientation,
  isAIGame,
  aiDifficulty,
}: {
  myUsername: string;
  opponentUsername: string;
  myScore: number;
  opponentScore: number;
  orientation: 'white' | 'black';
  isAIGame?: boolean;
  aiDifficulty?: AIDifficulty | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Game Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AI Info Banner */}
        {isAIGame && aiDifficulty && (
          <div className="bg-blue-600/20 border border-blue-600 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-400" />
              <div>
                <div className="font-semibold text-sm">{getAIOpponentName(aiDifficulty)}</div>
                <div className="text-xs text-gray-400">
                  XP Multiplier: {getAIDifficultyMultiplier(aiDifficulty)}x
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Opponent */}
        <PlayerInfo
          username={opponentUsername}
          score={opponentScore}
          color={orientation === 'white' ? 'black' : 'white'}
          isAI={isAIGame}
        />

        <div className="border-t dark:border-gray-700" />

        {/* Current Player */}
        <PlayerInfo
          username={myUsername}
          score={myScore}
          color={orientation}
          isCurrentPlayer
        />
      </CardContent>
    </Card>
  );
}

function PlayerInfo({
  username,
  score,
  color,
  isCurrentPlayer = false,
  isAI = false,
}: {
  username: string;
  score: number;
  color: 'white' | 'black';
  isCurrentPlayer?: boolean;
  isAI?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div
          className={`w-4 h-4 rounded-full ${
            color === 'white' ? 'bg-white border-2 border-gray-400' : 'bg-gray-900'
          }`}
        />
        <span className={`font-medium ${isCurrentPlayer ? 'text-blue-500' : ''} flex items-center gap-1`}>
          {username}
          {isAI && <Bot className="w-4 h-4 text-blue-400" />}
        </span>
      </div>
      <span className="text-lg font-bold">{score}</span>
    </div>
  );
}

function MatchmakingControls({
  onFindMatch,
  onChallengeUser,
  onPlayAI,
  challengeUsername,
  setChallengeUsername,
  showChallenge,
  setShowChallenge,
}: {
  onFindMatch: () => void;
  onChallengeUser: () => void;
  onPlayAI?: () => void;
  challengeUsername: string;
  setChallengeUsername: (value: string) => void;
  showChallenge: boolean;
  setShowChallenge: (value: boolean) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Find a Match</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={onFindMatch} className="w-full" size="lg">
          Find Random Match
        </Button>

        {onPlayAI && (
          <Button onClick={onPlayAI} variant="secondary" className="w-full" size="lg">
            <Bot className="w-4 h-4 mr-2" />
            Play vs AI
          </Button>
        )}

        {!showChallenge ? (
          <Button
            onClick={() => setShowChallenge(true)}
            variant="outline"
            className="w-full"
          >
            Challenge a Friend
          </Button>
        ) : (
          <div className="space-y-2">
            <input
              type="text"
              value={challengeUsername}
              onChange={(e) => setChallengeUsername(e.target.value)}
              placeholder="Friend&apos;s username"
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
            />
            <div className="flex gap-2">
              <Button onClick={onChallengeUser} className="flex-1">
                Challenge
              </Button>
              <Button
                onClick={() => setShowChallenge(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}