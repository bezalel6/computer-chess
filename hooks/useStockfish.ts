/**
 * Stockfish Hook
 *
 * React hook for interacting with Stockfish engine.
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { getStockfishManager } from '@/lib/stockfish/worker-manager';
import type { MoveScore, MovesAnalysis } from '@/lib/stockfish/worker-manager';

export function useStockfish() {
  const stockfishRef = useRef(getStockfishManager());

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      stockfishRef.current.terminate();
    };
  }, []);

  const analyzeMoves = useCallback(async (fen: string): Promise<MovesAnalysis> => {
    return stockfishRef.current.analyzeMoves(fen);
  }, []);

  const analyzeMove = useCallback(async (
    fen: string,
    move: string,
    thinkTime?: number
  ): Promise<MoveScore> => {
    return stockfishRef.current.analyzeMove(fen, move, thinkTime);
  }, []);

  const getBestMove = useCallback(async (
    fen: string,
    thinkTime?: number
  ): Promise<string> => {
    return stockfishRef.current.getBestMove(fen, thinkTime);
  }, []);

  return {
    analyzeMoves,
    analyzeMove,
    getBestMove,
  };
}