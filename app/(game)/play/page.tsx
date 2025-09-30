/**
 * Play Page
 *
 * Main chess game interface with board, panels, and real-time functionality.
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { ChessBoardComponent } from '@/components/game/ChessBoard';
import { LeftPanel } from '@/components/panels/LeftPanel';
import { RightPanel } from '@/components/panels/RightPanel';
import { RealtimeProvider } from '@/components/providers/RealtimeProvider';
import { AIDifficultySelector } from '@/components/game/AIDifficultySelector';
import { AIThinkingIndicator } from '@/components/game/AIThinkingIndicator';
import { useGameStore } from '@/stores/gameStore';
import { useChallengeStore } from '@/stores/challengeStore';
import { useSound } from '@/hooks/useSound';
import { findRandomMatch, challengeUser, submitMove } from '@/app/actions/match';
import { startAIGame, getAIMove } from '@/app/actions/ai-game';
import { getAIOpponentName } from '@/lib/ai/helpers';
import { createChallenges } from '@/lib/chess/challenge-maker';
import { Chess } from 'chess.ts';
import type { AIDifficulty } from '@prisma/client';

export default function PlayPage() {
  const { data: session, status } = useSession();
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showAISelector, setShowAISelector] = useState(false);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [isAIGame, setIsAIGame] = useState(false);
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty | null>(null);

  const game = useGameStore((state) => state.game);
  const startNewGame = useGameStore((state) => state.startNewGame);
  const isMyTurn = useGameStore((state) => state.isMyTurn);
  const isGameOver = useGameStore((state) => state.isGameOver);
  const currentMatch = useGameStore((state) => state.currentMatch);

  const setChallenges = useChallengeStore((state) => state.setChallenges);
  const { play } = useSound();

  // Generate challenges when it's the player's turn
  // MUST be before any conditional returns (Rules of Hooks)
  useEffect(() => {
    if (session && isMyTurn() && !isGameOver()) {
      generateChallenges();
    }
  }, [game, isMyTurn, isGameOver, session]);

  // Redirect if not authenticated
  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">
      <p>Loading...</p>
    </div>;
  }

  if (!session) {
    redirect('/login');
  }

  async function generateChallenges() {
    try {
      const challenges = await createChallenges(game);
      setChallenges(challenges);
    } catch (error) {
      console.error('Failed to generate challenges:', error);
    }
  }

  async function handleFindMatch() {
    setIsSearching(true);
    setSearchError(null);

    try {
      const result = await findRandomMatch();

      if (result.success && result.match) {
        // Match found! Start the game
        const myUsername = session?.user?.username || 'You';
        const myColor =
          result.match.white === myUsername ? 'white' : 'black';

        startNewGame(
          result.match.id,
          result.match.white,
          result.match.black,
          myColor
        );

        play('start');
        setIsSearching(false);
      } else {
        // Still waiting for opponent
        setSearchError(result.error || 'Searching for opponent...');

        // Poll again after 3 seconds
        setTimeout(() => {
          if (isSearching) {
            handleFindMatch();
          }
        }, 3000);
      }
    } catch (error) {
      console.error('Error finding match:', error);
      setSearchError('Failed to find match');
      setIsSearching(false);
    }
  }

  async function handleChallengeUser(username: string) {
    try {
      const result = await challengeUser(username);

      if (result.success && result.match) {
        // Match created
        const myUsername = session?.user?.username || 'You';
        const myColor =
          result.match.white === myUsername ? 'white' : 'black';

        startNewGame(
          result.match.id,
          result.match.white,
          result.match.black,
          myColor
        );

        play('start');
      } else {
        setSearchError(result.error || 'Failed to challenge user');
      }
    } catch (error) {
      console.error('Error challenging user:', error);
      setSearchError('Failed to send challenge');
    }
  }

  async function handleStartAIGame(difficulty: AIDifficulty, playerColor: 'white' | 'black') {
    setShowAISelector(false);
    setSearchError(null);

    try {
      const result = await startAIGame(difficulty, playerColor);

      if (result.success && result.game) {
        setIsAIGame(true);
        setAiDifficulty(difficulty);

        const aiName = getAIOpponentName(difficulty);
        const whiteName = playerColor === 'white' ? (session?.user?.username || 'You') : aiName;
        const blackName = playerColor === 'black' ? (session?.user?.username || 'You') : aiName;

        startNewGame(
          result.game.id,
          whiteName,
          blackName,
          playerColor
        );

        // Load AI's first move if player is black
        if (playerColor === 'black' && result.game.currentFen) {
          game.load(result.game.currentFen);
        }

        play('start');
        await generateChallenges();
      } else {
        setSearchError(result.error || 'Failed to start AI game');
      }
    } catch (error) {
      console.error('Error starting AI game:', error);
      setSearchError('Failed to start AI game');
    }
  }

  async function handleMoveMade(move: {
    from: string;
    to: string;
    promotion?: string;
  }) {
    if (!currentMatch) return;

    try {
      const newFen = game.fen();

      const result = await submitMove(currentMatch.id, move, newFen);

      if (!result.success) {
        console.error('Failed to submit move:', result.error);
        return;
      }

      // If AI game, trigger AI response
      if (isAIGame && !isGameOver()) {
        setIsAIThinking(true);

        // Short delay for better UX
        setTimeout(async () => {
          try {
            const aiMoveResult = await getAIMove(currentMatch.id);

            if (aiMoveResult.success && aiMoveResult.move && aiMoveResult.newFen) {
              // Update game state with AI move
              game.load(aiMoveResult.newFen);
              play('move');
              setIsAIThinking(false);

              // Generate new challenges for player's next turn
              await generateChallenges();
            } else {
              console.error('AI move failed:', aiMoveResult.error);
              setIsAIThinking(false);
            }
          } catch (error) {
            console.error('Error getting AI move:', error);
            setIsAIThinking(false);
          }
        }, 1500);
      }

      // Move is now automatically synced via Pusher real-time events for multiplayer
    } catch (error) {
      console.error('Error submitting move:', error);
    }
  }

  return (
    <RealtimeProvider matchId={currentMatch?.id || null}>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        {/* Header */}
        <header className="border-b border-gray-700 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Computer Chess</h1>
            <p className="text-sm text-gray-400">&quot;The next lichess&quot; - nobody ever</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Signed in as</p>
            <p className="font-semibold">{session?.user?.username}</p>
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_300px] gap-6">
          {/* Left Panel */}
          <div className="order-2 lg:order-1">
            <LeftPanel />
          </div>

          {/* Chess Board */}
          <div className="order-1 lg:order-2">
            <div className="max-w-[600px] mx-auto">
              <ChessBoardComponent onMoveMade={handleMoveMade} />
            </div>

            {/* Game Over Message */}
            {isGameOver() && (
              <div className="mt-6 text-center">
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <h2 className="text-2xl font-bold mb-2">Game Over</h2>
                  <p className="text-gray-400 mb-4">
                    {game.inCheckmate()
                      ? `Checkmate! ${game.turn() === 'w' ? 'Black' : 'White'} wins!`
                      : game.inStalemate()
                      ? 'Stalemate!'
                      : game.inDraw()
                      ? 'Draw!'
                      : 'Game ended'}
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
                  >
                    Play Again
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel */}
          <div className="order-3">
            <RightPanel
              onFindMatch={handleFindMatch}
              onChallengeUser={handleChallengeUser}
              onPlayAI={() => setShowAISelector(true)}
              isAIGame={isAIGame}
              aiDifficulty={aiDifficulty}
            />

            {/* AI Thinking Indicator */}
            {isAIThinking && aiDifficulty && (
              <div className="mt-4">
                <AIThinkingIndicator aiName={getAIOpponentName(aiDifficulty)} />
              </div>
            )}

            {/* Search Status */}
            {isSearching && (
              <div className="mt-4 bg-blue-600/20 border border-blue-600 rounded-lg p-4 text-center">
                <div className="animate-pulse">
                  <p className="font-semibold">Searching for opponent...</p>
                  {searchError && (
                    <p className="text-sm text-gray-400 mt-1">{searchError}</p>
                  )}
                </div>
              </div>
            )}

            {/* Error Message */}
            {!isSearching && searchError && (
              <div className="mt-4 bg-red-600/20 border border-red-600 rounded-lg p-4 text-center">
                <p className="text-sm">{searchError}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* AI Difficulty Selector Modal */}
      <AIDifficultySelector
        open={showAISelector}
        onClose={() => setShowAISelector(false)}
        onStartGame={handleStartAIGame}
      />
    </div>
    </RealtimeProvider>
  );
}