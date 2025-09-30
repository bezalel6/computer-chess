/**
 * Stockfish Worker Manager
 *
 * Manages Stockfish Web Worker pool for move analysis and challenge generation.
 */

export interface MoveScore {
  move: string;
  cp: number;
}

export interface MovesAnalysis {
  moves: Map<string, MoveScore>;
  sorted: MoveScore[];
}

class StockfishWorkerManager {
  private workers: Worker[] = [];
  private readonly maxWorkers = 4;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeWorkers();
    }
  }

  private initializeWorkers() {
    // Workers are created on-demand to avoid memory overhead
  }

  private createWorker(): Worker {
    return new Worker('/stockfish.js');
  }

  /**
   * Analyze all possible moves from a given FEN position
   */
  async analyzeMoves(fen: string): Promise<MovesAnalysis> {
    return new Promise((resolve, reject) => {
      const result: MovesAnalysis = {
        moves: new Map(),
        sorted: [],
      };

      // Parse available moves from FEN (simplified - in reality we'd use chess.ts)
      // For now, we'll analyze each move separately
      const worker = this.createWorker();
      let analysisComplete = false;

      const timeout = setTimeout(() => {
        if (!analysisComplete) {
          worker.terminate();
          reject(new Error('Stockfish analysis timed out'));
        }
      }, 30000); // 30 second timeout

      worker.onmessage = (event: MessageEvent) => {
        const message = event.data as string;

        if (message.includes('bestmove')) {
          analysisComplete = true;
          clearTimeout(timeout);
          worker.terminate();

          // Sort moves by evaluation
          result.sorted = Array.from(result.moves.values()).sort((a, b) => b.cp - a.cp);
          resolve(result);
        } else if (message.includes('info depth') && message.includes('score cp')) {
          // Parse move and score from Stockfish output
          const pvMatch = message.match(/pv ([a-h][1-8][a-h][1-8][qrbn]?)/);
          const cpMatch = message.match(/score cp (-?\d+)/);

          if (pvMatch && cpMatch) {
            const move = pvMatch[1];
            const cp = parseInt(cpMatch[1], 10);

            result.moves.set(move, { move, cp });
          }
        }
      };

      worker.onerror = (error) => {
        clearTimeout(timeout);
        worker.terminate();
        reject(error);
      };

      // Send commands to Stockfish
      worker.postMessage('uci');
      worker.postMessage(`position fen ${fen}`);
      worker.postMessage('go depth 15');
    });
  }

  /**
   * Analyze a specific move from a position
   */
  async analyzeMove(fen: string, move: string, thinkTime: number = 100): Promise<MoveScore> {
    return new Promise((resolve, reject) => {
      const worker = this.createWorker();
      let moveScore: MoveScore | null = null;

      const timeout = setTimeout(() => {
        if (!moveScore) {
          worker.terminate();
          reject(new Error('Stockfish analysis timed out'));
        }
      }, thinkTime * 20); // Safety timeout

      worker.onmessage = (event: MessageEvent) => {
        const message = event.data as string;

        if (message.includes('bestmove')) {
          clearTimeout(timeout);
          worker.terminate();

          if (moveScore) {
            resolve(moveScore);
          } else {
            resolve({ move, cp: 0 });
          }
        } else if (message.includes('info depth') && message.includes('score cp')) {
          const cpMatch = message.match(/score cp (-?\d+)/);
          if (cpMatch) {
            const cp = parseInt(cpMatch[1], 10);
            moveScore = { move, cp };
          }
        }
      };

      worker.onerror = (error) => {
        clearTimeout(timeout);
        worker.terminate();
        reject(error);
      };

      // Send commands
      worker.postMessage('uci');
      worker.postMessage(`position fen ${fen}`);
      worker.postMessage(`go movetime ${thinkTime} searchmoves ${move}`);
    });
  }

  /**
   * Get best move from position
   */
  async getBestMove(fen: string, thinkTime: number = 1000): Promise<string> {
    return new Promise((resolve, reject) => {
      const worker = this.createWorker();
      let bestMove: string | null = null;

      const timeout = setTimeout(() => {
        worker.terminate();
        reject(new Error('Stockfish analysis timed out'));
      }, thinkTime * 3);

      worker.onmessage = (event: MessageEvent) => {
        const message = event.data as string;

        if (message.includes('bestmove')) {
          clearTimeout(timeout);
          const match = message.match(/bestmove ([a-h][1-8][a-h][1-8][qrbn]?)/);
          if (match) {
            bestMove = match[1];
          }
          worker.terminate();

          if (bestMove) {
            resolve(bestMove);
          } else {
            reject(new Error('No best move found'));
          }
        }
      };

      worker.onerror = (error) => {
        clearTimeout(timeout);
        worker.terminate();
        reject(error);
      };

      worker.postMessage('uci');
      worker.postMessage(`position fen ${fen}`);
      worker.postMessage(`go movetime ${thinkTime}`);
    });
  }

  /**
   * Cleanup all workers
   */
  terminate() {
    this.workers.forEach((worker) => worker.terminate());
    this.workers = [];
  }
}

// Singleton instance
let stockfishManager: StockfishWorkerManager | null = null;

export function getStockfishManager(): StockfishWorkerManager {
  if (typeof window === 'undefined') {
    // Return a no-op manager for SSR
    return {
      analyzeMoves: async () => ({ moves: new Map(), sorted: [] }),
      analyzeMove: async (fen, move) => ({ move, cp: 0 }),
      getBestMove: async () => '',
      terminate: () => {},
    } as StockfishWorkerManager;
  }

  if (!stockfishManager) {
    stockfishManager = new StockfishWorkerManager();
  }

  return stockfishManager;
}

export default StockfishWorkerManager;