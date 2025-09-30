/**
 * Game Store (Zustand)
 *
 * Manages the chess game state, moves, scores, and game lifecycle.
 */

import { create } from 'zustand';
import { Chess, type Move } from 'chess.ts';

export interface Score {
  myScore: number;
  opponentScore: number;
}

export interface GameState {
  // Game state
  game: Chess;
  orientation: 'white' | 'black';
  isPlaying: boolean;
  currentMatch: {
    id: string;
    white: string;
    black: string;
  } | null;

  // Scores
  score: Score;

  // Move history
  moves: Move[];

  // Actions
  setGame: (game: Chess) => void;
  setOrientation: (orientation: 'white' | 'black') => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentMatch: (match: { id: string; white: string; black: string } | null) => void;

  makeMove: (move: string | { from: string; to: string; promotion?: string }) => boolean;
  addMove: (move: Move) => void;

  addToScore: (addToMe: number, addToOpponent: number) => void;
  updateMyScore: (points: number) => void;
  updateOpponentScore: (points: number) => void;

  startNewGame: (matchId: string, whitePlayer: string, blackPlayer: string, myColor: 'white' | 'black') => void;
  resetGame: () => void;

  isGameOver: () => boolean;
  isMyTurn: () => boolean;
}

const initialScore: Score = {
  myScore: 0,
  opponentScore: 0,
};

export const useGameStore = create<GameState>((set, get) => ({
  // Initial state
  game: new Chess(),
  orientation: 'white',
  isPlaying: false,
  currentMatch: null,
  score: initialScore,
  moves: [],

  // Setters
  setGame: (game) => set({ game }),
  setOrientation: (orientation) => set({ orientation }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentMatch: (currentMatch) => set({ currentMatch }),

  // Move management
  makeMove: (move) => {
    const { game } = get();
    const gameCopy = new Chess(game.fen());

    try {
      const result = gameCopy.move(move);
      if (result) {
        set({ game: gameCopy });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Invalid move:', error);
      return false;
    }
  },

  addMove: (move) => {
    set((state) => ({
      moves: [...state.moves, move],
    }));
  },

  // Score management
  addToScore: (addToMe, addToOpponent) => {
    set((state) => ({
      score: {
        myScore: state.score.myScore + addToMe,
        opponentScore: state.score.opponentScore + addToOpponent,
      },
    }));
  },

  updateMyScore: (points) => {
    set((state) => ({
      score: {
        ...state.score,
        myScore: state.score.myScore + points,
      },
    }));
  },

  updateOpponentScore: (points) => {
    set((state) => ({
      score: {
        ...state.score,
        opponentScore: state.score.opponentScore + points,
      },
    }));
  },

  // Game lifecycle
  startNewGame: (matchId, whitePlayer, blackPlayer, myColor) => {
    set({
      game: new Chess(),
      orientation: myColor,
      isPlaying: true,
      currentMatch: {
        id: matchId,
        white: whitePlayer,
        black: blackPlayer,
      },
      score: initialScore,
      moves: [],
    });
  },

  resetGame: () => {
    set({
      game: new Chess(),
      orientation: 'white',
      isPlaying: false,
      currentMatch: null,
      score: initialScore,
      moves: [],
    });
  },

  // Utility functions
  isGameOver: () => {
    const { game } = get();
    return game.gameOver() || game.inDraw();
  },

  isMyTurn: () => {
    const { game, orientation } = get();
    return game.turn() === orientation.charAt(0);
  },
}));