/**
 * ChessBoard Component
 *
 * Main chess board with move handling and visual feedback.
 * Using react-chessboard v5 API
 */

'use client';

import { Chessboard } from 'react-chessboard';
import { useGameStore } from '@/stores/gameStore';
import { useSound } from '@/hooks/useSound';
import { useChallengeStore } from '@/stores/challengeStore';
import { useState } from 'react';

type Square = string;
type Piece = string;

interface ChessBoardProps {
  onMoveMade?: (move: { from: string; to: string; promotion?: string }) => void;
}

export function ChessBoardComponent({ onMoveMade }: ChessBoardProps) {
  const game = useGameStore((state) => state.game);
  const orientation = useGameStore((state) => state.orientation);
  const isPlaying = useGameStore((state) => state.isPlaying);
  const makeMove = useGameStore((state) => state.makeMove);
  const isMyTurn = useGameStore((state) => state.isMyTurn);
  const isGameOver = useGameStore((state) => state.isGameOver);

  const checkChallenges = useChallengeStore((state) => state.checkChallenges);

  const { play } = useSound();
  const [promotionSquare, setPromotionSquare] = useState<{
    from: string;
    to: string;
  } | null>(null);

  function handlePieceDrop(
    sourceSquare: Square,
    targetSquare: Square,
    piece: Piece
  ): boolean {
    // Only allow moves when it's the player's turn and game is active
    if (!isPlaying || !isMyTurn()) {
      return false;
    }

    // Check if this is a pawn promotion
    const isPawnPromotion =
      (piece === 'wP' && targetSquare[1] === '8') ||
      (piece === 'bP' && targetSquare[1] === '1');

    if (isPawnPromotion) {
      // Show promotion dialog
      setPromotionSquare({ from: sourceSquare, to: targetSquare });
      return false; // Don't make the move yet
    }

    // Attempt the move
    const moveResult = attemptMove(sourceSquare, targetSquare);
    return moveResult;
  }

  function attemptMove(
    from: string,
    to: string,
    promotion?: string
  ): boolean {
    const moveObj = { from, to, promotion };

    // Check if move is legal
    const piece = game.get(from as Square);
    const targetPiece = game.get(to as Square);

    // Attempt to make the move
    const success = makeMove(moveObj);

    if (!success) {
      play('fail');
      return false;
    }

    // Play appropriate sound
    if (targetPiece) {
      play('capture');
    } else if (promotion) {
      play('promote');
    } else {
      play('move');
    }

    // Check for check
    if (game.inCheck()) {
      play('check');
    }

    // Check for game over
    if (isGameOver()) {
      play('gameOver');
    }

    // Check challenges and award points
    const move = game.history({ verbose: true }).slice(-1)[0];
    if (move) {
      const pointsAwarded = checkChallenges(move, isGameOver());

      // Update score on server if points were awarded
      if (pointsAwarded > 0 && onMoveMade) {
        // This will be handled by the parent component
      }
    }

    // Notify parent
    if (onMoveMade) {
      onMoveMade(moveObj);
    }

    return true;
  }

  function handlePromotion(piece: 'q' | 'r' | 'b' | 'n') {
    if (!promotionSquare) return;

    const success = attemptMove(
      promotionSquare.from,
      promotionSquare.to,
      piece
    );

    setPromotionSquare(null);

    if (!success) {
      play('fail');
    }
  }

  // Get FEN string for position - ensure it's always a string
  let position: string = 'start';
  try {
    if (game && typeof game.fen === 'function') {
      const fen = game.fen();
      if (typeof fen === 'string' && fen.length > 0) {
        position = fen;
      }
    }
  } catch (error) {
    console.error('Error getting FEN position:', error);
  }

  // react-chessboard v5 options object
  const chessboardOptions = {
    position,
    boardOrientation: orientation,
    onPieceDrop: handlePieceDrop,
    allowDragging: isPlaying && isMyTurn(),
    boardStyle: {
      borderRadius: '4px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
    },
    darkSquareStyle: { backgroundColor: '#779952' },
    lightSquareStyle: { backgroundColor: '#edeed1' },
  };

  return (
    <div className="relative">
      <div className={`${!isPlaying ? 'opacity-50 pointer-events-none' : ''}`}>
        <Chessboard options={chessboardOptions} />
      </div>

      {/* Promotion Dialog */}
      {promotionSquare && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl">
            <h3 className="text-lg font-semibold mb-4 text-center">
              Choose Promotion Piece
            </h3>
            <div className="flex gap-4">
              {(['q', 'r', 'b', 'n'] as const).map((piece) => (
                <button
                  key={piece}
                  onClick={() => handlePromotion(piece)}
                  className="w-16 h-16 flex items-center justify-center text-4xl border-2 border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {piece === 'q' && '♕'}
                  {piece === 'r' && '♖'}
                  {piece === 'b' && '♗'}
                  {piece === 'n' && '♘'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Game Status Overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 pointer-events-none">
          <div className="bg-gray-900 px-6 py-3 rounded-lg">
            <p className="text-white font-semibold">Waiting for game...</p>
          </div>
        </div>
      )}
    </div>
  );
}