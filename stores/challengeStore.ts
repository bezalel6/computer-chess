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
export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Expert';

export type ChallengeType =
  | 'Tactical Shot'
  | 'Best Capture'
  | 'Defensive Genius'
  | 'Outpost Master'
  | 'Center Control'
  | 'Weak Square Exploiter'
  | 'Evaluation Master'
  | 'Quiet Brilliancy'
  | 'Knight Ninja'
  | 'Bishop Brilliance'
  | 'Rook Lift'
  | 'Queen Power'
  | 'Pawn Storm'
  | 'King Safety'
  | 'Space Invader'
  | 'Best Move' // Legacy
  | 'Worst Move' // Legacy
  | 'Best Knight Move'; // Legacy

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
  name: ChallengeType;
  description: string;
  mandatory: ChallengeMandatory;
  ttp: ChallengeTimeToPlay;
  checkChallenge: ChallengeTerms;
  status: ChallengeStatus;
  reward: number;
  difficulty: Difficulty;
}

export interface ChallengeState {
  challenges: Challenge[];
  activeChallenge: Challenge | null;
  streakCount: number;
  currentGamePoints: number;
  completedThisTurn: Challenge[];

  // Actions
  addChallenge: (challenge: Challenge) => void;
  setChallenges: (challenges: Challenge[]) => void;
  setActiveChallenge: (challenge: Challenge | null) => void;
  updateChallengeStatus: (id: string, status: ChallengeStatus) => void;
  checkChallenges: (move: Move, isGameOver: boolean) => number; // Returns points awarded
  clearChallenges: () => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  addPoints: (points: number) => void;
  resetGame: () => void;
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
  streakCount: 0,
  currentGamePoints: 0,
  completedThisTurn: [],

  addChallenge: (challenge) => {
    set((state) => ({
      challenges: [...state.challenges, challenge],
    }));
  },

  setChallenges: (challenges) => {
    set({ challenges, completedThisTurn: [] });
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
    const { challenges, streakCount } = get();
    const completedThisTurn: Challenge[] = [];
    let totalPointsAwarded = 0;

    const updatedChallenges = challenges.map((challenge) => {
      if (challenge.status !== 'possible') {
        return challenge;
      }

      const isCorrectMove = moveMatchesChallenge(move, challenge.checkChallenge.correctMoves);

      if (isCorrectMove) {
        completedThisTurn.push(challenge);
        return { ...challenge, status: 'success' as ChallengeStatus };
      }

      // Check if challenge is still possible
      switch (challenge.ttp) {
        case 'Turn':
          return { ...challenge, status: 'fail' as ChallengeStatus };

        case 'Game':
          if (isGameOver) {
            return { ...challenge, status: 'fail' as ChallengeStatus };
          }
          return challenge;

        default:
          return challenge;
      }
    });

    // Calculate points with bonuses
    if (completedThisTurn.length > 0) {
      // Base points
      const basePoints = completedThisTurn.reduce((sum, c) => sum + c.reward, 0);

      // Streak bonus
      const streakBonus = applyStreakBonus(basePoints, streakCount + completedThisTurn.length);

      // Combo bonus
      const comboBonus = getComboBonus(completedThisTurn.length);

      totalPointsAwarded = Math.round(basePoints + streakBonus + comboBonus);

      set((state) => ({
        challenges: updatedChallenges,
        completedThisTurn,
        streakCount: state.streakCount + completedThisTurn.length,
        currentGamePoints: state.currentGamePoints + totalPointsAwarded,
      }));
    } else {
      // Failed to complete any challenges - reset streak
      set({
        challenges: updatedChallenges,
        completedThisTurn: [],
        streakCount: 0,
      });
    }

    return totalPointsAwarded;
  },

  incrementStreak: () => {
    set((state) => ({ streakCount: state.streakCount + 1 }));
  },

  resetStreak: () => {
    set({ streakCount: 0 });
  },

  addPoints: (points) => {
    set((state) => ({ currentGamePoints: state.currentGamePoints + points }));
  },

  clearChallenges: () => {
    set({ challenges: [], activeChallenge: null, completedThisTurn: [] });
  },

  resetGame: () => {
    set({
      challenges: [],
      activeChallenge: null,
      streakCount: 0,
      currentGamePoints: 0,
      completedThisTurn: [],
    });
  },
}));

/**
 * Apply streak bonus multiplier to base points
 */
function applyStreakBonus(basePoints: number, streakCount: number): number {
  if (streakCount >= 15) return basePoints * 0.75;
  if (streakCount >= 10) return basePoints * 0.50;
  if (streakCount >= 5) return basePoints * 0.25;
  if (streakCount >= 3) return basePoints * 0.10;
  return 0;
}

/**
 * Get flat bonus points for completing multiple challenges in one turn
 */
function getComboBonus(comboSize: number): number {
  if (comboSize >= 5) return 200;
  if (comboSize >= 4) return 100;
  if (comboSize >= 3) return 50;
  if (comboSize >= 2) return 20;
  return 0;
}