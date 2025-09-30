/**
 * Game Over Dialog
 *
 * Shows game result and options after game ends.
 */

'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, Medal, Award } from 'lucide-react';

interface GameOverDialogProps {
  open: boolean;
  result: 'checkmate' | 'stalemate' | 'draw';
  winner?: 'white' | 'black';
  myColor: 'white' | 'black';
  myScore: number;
  opponentScore: number;
  onPlayAgain: () => void;
  onClose: () => void;
}

export function GameOverDialog({
  open,
  result,
  winner,
  myColor,
  myScore,
  opponentScore,
  onPlayAgain,
  onClose,
}: GameOverDialogProps) {
  const didIWin = winner === myColor;

  const getTitle = () => {
    if (result === 'checkmate') {
      return didIWin ? 'Victory!' : 'Defeat';
    }
    if (result === 'stalemate') {
      return 'Stalemate';
    }
    return 'Draw';
  };

  const getIcon = () => {
    if (didIWin) {
      return <Trophy className="w-16 h-16 text-yellow-500 mx-auto" />;
    }
    if (result === 'draw' || result === 'stalemate') {
      return <Medal className="w-16 h-16 text-gray-400 mx-auto" />;
    }
    return <Award className="w-16 h-16 text-red-500 mx-auto" />;
  };

  const getMessage = () => {
    if (result === 'checkmate') {
      return didIWin
        ? 'Congratulations! You checkmated your opponent.'
        : 'Your opponent has checkmated you.';
    }
    if (result === 'stalemate') {
      return 'The game ended in a stalemate. No legal moves available.';
    }
    return 'The game ended in a draw.';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-4">{getIcon()}</div>
          <DialogTitle className="text-2xl text-center">{getTitle()}</DialogTitle>
          <DialogDescription className="text-center">
            {getMessage()}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-semibold mb-2 text-center">Final Score</h3>
            <div className="flex justify-between items-center">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">You</p>
                <p className="text-2xl font-bold">{myScore}</p>
              </div>
              <div className="text-2xl font-bold text-gray-400">-</div>
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Opponent</p>
                <p className="text-2xl font-bold">{opponentScore}</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-center gap-2">
          <Button onClick={onPlayAgain} size="lg" className="flex-1">
            Play Again
          </Button>
          <Button onClick={onClose} variant="outline" size="lg" className="flex-1">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}