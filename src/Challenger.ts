// import * as A from 'simple-lichess-api'

import { Chess, SQUARES } from "chess.ts";
import { Challenge, convertMoveToStr, Reward } from "./Challenges";

export function challengeeee(chess: Chess = new Chess()) {
    // A.lookup({ fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", database: "lichess" }).listen(console.log)
    return new Promise<Moves>((resolve, reject) => {

        let movesLeft: number;

        const res: Moves = { moves: new Map(), sorted: [] };
        function got(event: any, worker: Worker) {

            const str = event.data as string;
            if (str.includes("bestmove")) {
                worker.postMessage("quit");
                worker.terminate()
                movesLeft--;
                if (!movesLeft) {

                    res.moves.forEach(move => {
                        res.sorted.push(move);
                    })
                    res.sorted = res.sorted.sort((a, b) => b.cp - a.cp)
                    resolve(res)
                }
            } else if (str.includes("info depth")) {
                const move = str.split(" pv ")[1].split(" ")[0];
                const cp = Number(str.split("score cp ")[1].split(" ")[0]);
                res.moves.set(move, { move, cp });
            }
        };
        const fen = chess.fen();
        // stockfish.postMessage("position fen " + fen);
        const moves = chess.moves({ verbose: true });
        movesLeft = moves.length;
        moves.forEach(move => {
            const notation = convertMoveToStr(move);
            analyzeMove(notation)
        })
        function analyzeMove(move: string) {
            post("go movetime 100 searchmoves " + move);
        }

        function post(msg: any) {
            let stockfish = new Worker('stockfish.js');
            stockfish.onmessage = (e) => {
                got(e, stockfish);
            };
            stockfish.postMessage("position fen " + fen)
            stockfish.postMessage(msg);

        }
    })
}

export async function createChallenges(chess: Chess = new Chess()) {
    const evals = await challengeeee(chess);
    const maker = new Maker(chess, evals);
    const made = maker.make()
    const i = Math.floor(Math.random() * made.length);
    return [made[i]];
}

class Maker {
    position: Chess;
    moves: Moves;
    knightLocs: string[];
    constructor(position: Chess, moves: Moves) {
        this.position = position;
        this.moves = moves;
        this.knightLocs = new Array<string>();
        for (let square in SQUARES) {
            const piece = this.position.get(square);
            if (piece && piece.color === position.turn() && piece.type === "n") {
                this.knightLocs.push(square);
            }
        }
    }
    /**
     * 
     * @param edge best moves or worst moves
     * @param maxDifference the maximum difference allowed between the edge move. leave empty to get all moves that are signed the same as the edge move (if the edge move is positive - every other move with a positive score will be returned)
     * @returns 
     */
    edgeMoves(edge: "best" | "worst", maxDifference?: number) {
        const best = this.moves.sorted[edge === "best" ? 0 : this.moves.sorted.length - 1];
        return this.moves.sorted.filter(m => {
            return m.cp * best.cp >= 0 && (maxDifference === undefined || Math.abs(m.cp - best.cp) <= maxDifference)
        })
    }
    bestMove(): Challenge {
        return { checkChallenge: this.moves.sorted[0].move, name: "Best Move", description: "make the best move in this position", mandatory: "optional", reward: Reward.Queen, status: "possible", ttp: "Turn" }
    }
    worstMove(): Challenge {
        return { checkChallenge: this.moves.sorted[this.moves.sorted.length - 1].move, name: "Worst Move", description: "make the worst move in this position", mandatory: "optional", reward: Reward.Queen, status: "possible", ttp: "Turn" }
    }
    bestKnightMove(): Challenge | null {
        if (!this.knightLocs.length)
            return null;

        return { checkChallenge: this.moves.sorted.filter(m => this.knightLocs.find(loc => loc === m.move.substring(0, 2)))[0].move, name: "Best Knight Move", description: "make the best knight move in this position", mandatory: "optional", reward: Reward.Queen, status: "possible", ttp: "Turn" }
    }
    make(): Challenge[] {
        const k = this.bestKnightMove();
        const ret = new Array<Challenge>();
        if (k) {
            ret.push(k)
        }
        return [this.bestMove(), this.worstMove(), ...ret]
    }
}
interface MoveScore {
    move: string;
    cp: number;
}
interface Moves {
    moves: Map<string, MoveScore>;
    sorted: MoveScore[];
}