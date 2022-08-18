import React, { createRef, useRef, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { Chessboard, Square } from 'react-chessboard';
import { Init, PeerActions } from './Server';
import { Chess, Move, PartialMove } from 'chess.ts';
function App() {
  const [game, setGame] = useState(new Chess());

  const peerRef = createRef<PeerActions>();

  function makeAMove(move: MyMove) {
    const gameCopy = game.clone();
    const result = gameCopy.move(move);
    setGame(gameCopy);
    return result; // null if the move was illegal, the move object if the move was legal
  }

  function makeRandomMove() {
    const possibleMoves = game.moves();
    if (game.gameOver() || game.inDraw() || possibleMoves.length === 0)
      return; // exit if the game is over
    const randomIndex = Math.floor(Math.random() * possibleMoves.length);
    makeAMove(possibleMoves[randomIndex]);
  }

  function onDrop(sourceSquare: Square, targetSquare: Square) {
    const move = makeAMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q' // always promote to a queen for example simplicity
    });

    // illegal move
    if (move === null) return false;
    peerRef.current?.sendMove(move)

    // setTimeout(makeRandomMove, 200);
    return true;
  }

  return <div className='App'> <Chessboard position={game.fen()} onPieceDrop={onDrop} />
    <Init ref={peerRef} makeMove={makeAMove}></Init>
  </div>;
}
export type MyMove = string | PartialMove;
export default App;
