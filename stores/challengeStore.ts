/**
 * Challenge Store (Zustand)
 *
 * Manages challenges, their state, and completion tracking.
 */

import { create } from 'zustand';
import type { Move } from 'chess.ts';

export type ChallengeStatus = 'possible' | 'success' | 'fail';
export type ChallengeTimeToPlay = 'Turn' | 'Game' | '10 moves';
export type ChallengeMandatory = 'mandatory' | 'optional' | 'accepted';

export interface MoveOption {
  move: string; // e.g. "e2e4"
  cp: number; // centipawn evaluation
}

export interface ChallengeTerms {
  challengeType: 'any option' | 'dynamic relative to best option';
  correctMoves: MoveOption[];
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  mandatory: ChallengeMandatory;
  ttp: ChallengeTimeToPlay;
  checkChallenge: ChallengeTerms;
  status: ChallengeStatus;
  reward: number;
}

export interface ChallengeState {
  challenges: Challenge[];
  activeChallenge: Challenge | null;

  // Actions
  addChallenge: (challenge: Challenge) => void;
  setChallenges: (challenges: Challenge[]) => void;
  setActiveChallenge: (challenge: Challenge | null) => void;
  updateChallengeStatus: (id: string, status: ChallengeStatus) => void;
  checkChallenges: (move: Move, isGameOver: boolean) => void;
  clearChallenges: () => void;
}

// Helper function to convert move to string notation
export function convertMoveToStr(move: Move | { from: string; to: string; promotion?: string }): string {
  return move.from + move.to + (move.promotion ? '=' + move.promotion : '');
}

// Helper function to check if a move matches the challenge
function moveMatchesChallenge(move: Move, correctMoves: MoveOption[]): boolean {
  const moveStr = convertMoveToStr(move);
  return correctMoves.some((option) => option.move === moveStr);
}

export const useChallengeStore = create<ChallengeState>((set, get) => ({
  challenges: [],
  activeChallenge: null,

  addChallenge: (challenge) => {
    set((state) => ({
      challenges: [...state.challenges, challenge],
    }));
  },

  setChallenges: (challenges) => {
    set({ challenges });
  },

  setActiveChallenge: (activeChallenge) => {
    set({ activeChallenge });
  },

  updateChallengeStatus: (id, status) => {
    set((state) => ({
      challenges: state.challenges.map((c) =>
        c.id === id ? { ...c, status } : c
      ),
    }));
  },

  checkChallenges: (move, isGameOver) => {
    const { challenges } = get();

    const updatedChallenges = challenges.map((challenge) => {
      if (challenge.status !== 'possible') {
        return challenge;
      }

      const isCorrectMove = moveMatchesChallenge(move, challenge.checkChallenge.correctMoves);

      if (isCorrectMove) {
        return { ...challenge, status: 'success' as ChallengeStatus };
      }

      // Check if challenge is still possible
      switch (challenge.ttp) {
        case 'Turn':
          // Turn-based challenges fail if wrong move is made
          return { ...challenge, status: 'fail' as ChallengeStatus };

        case 'Game':
          // Game-based challenges fail only when game is over
          if (isGameOver) {
            return { ...challenge, status: 'fail' as ChallengeStatus };
          }
          return challenge;

        default:
          return challenge;
      }
    });

    set({ challenges: updatedChallenges });
  },

  clearChallenges: () => {
    set({ challenges: [], activeChallenge: null });
  },
}));