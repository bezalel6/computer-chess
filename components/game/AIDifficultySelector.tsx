/**
 * AI Difficulty Selector Component
 *
 * Modal for selecting AI opponent difficulty level.
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { startAIGame, type AIDifficulty } from '@/app/actions/ai-game';
import { useRouter } from 'next/navigation';

interface AIDifficultySelectorProps {
  open: boolean;
  onClose: () => void;
}

interface DifficultyLevel {
  id: AIDifficulty;
  name: string;
  description: string;
  elo: string;
  icon: string;
  color: string;
  xpMultiplier: string;
}

const difficulties: DifficultyLevel[] = [
  {
    id: 'BEGINNER',
    name: 'Rookie',
    description: 'Perfect for learning the basics',
    elo: '~800 ELO',
    icon: '🎯',
    color: 'bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 border-green-300',
    xpMultiplier: '0.5x XP',
  },
  {
    id: 'INTERMEDIATE',
    name: 'Player',
    description: 'Good for practicing tactics',
    elo: '~1200 ELO',
    icon: '⚡',
    color: 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 border-blue-300',
    xpMultiplier: '0.75x XP',
  },
  {
    id: 'ADVANCED',
    name: 'Expert',
    description: 'Challenging and strategic',
    elo: '~1800 ELO',
    icon: '🔥',
    color: 'bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800 border-purple-300',
    xpMultiplier: '1.0x XP',
  },
  {
    id: 'MASTER',
    name: 'Grandmaster',
    description: 'Elite AI opponent',
    elo: '~2400 ELO',
    icon: '👑',
    color: 'bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900 dark:hover:bg-yellow-800 border-yellow-300',
    xpMultiplier: '1.25x XP',
  },
];

export function AIDifficultySelector({ open, onClose }: AIDifficultySelectorProps) {
  const [starting, setStarting] = useState(false);
  const [selectedColor, setSelectedColor] = useState<'white' | 'black'>('white');
  const router = useRouter();

  async function handleSelectDifficulty(difficulty: AIDifficulty) {
    setStarting(true);

    try {
      const result = await startAIGame(difficulty, selectedColor);

      if (result.success && result.game) {
        // Navigate to game
        router.push(`/play?gameId=${result.game.id}`);
        onClose();
      } else {
        alert(result.error || 'Failed to start AI game');
      }
    } catch (error) {
      console.error('Error starting AI game:', error);
      alert('Failed to start AI game');
    } finally {
      setStarting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Play vs AI</DialogTitle>
          <DialogDescription>
            Choose your opponent's difficulty level and your color
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Color Selection */}
          <div className="flex items-center gap-4 justify-center">
            <span className="text-sm font-semibold">Play as:</span>
            <div className="flex gap-2">
              <Button
                variant={selectedColor === 'white' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedColor('white')}
              >
                ⚪ White
              </Button>
              <Button
                variant={selectedColor === 'black' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedColor('black')}
              >
                ⚫ Black
              </Button>
            </div>
          </div>

          {/* Difficulty Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {difficulties.map((diff) => (
              <button
                key={diff.id}
                onClick={() => handleSelectDifficulty(diff.id)}
                disabled={starting}
                className={`p-6 rounded-lg border-2 transition-all text-left ${diff.color} ${
                  starting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{diff.icon}</span>
                    <div>
                      <h3 className="text-lg font-bold">{diff.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {diff.elo}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded bg-white/50 dark:bg-black/30">
                    {diff.xpMultiplier}
                  </span>
                </div>

                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {diff.description}
                </p>
              </button>
            ))}
          </div>

          {starting && (
            <div className="text-center text-sm text-gray-500">
              Starting game...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}