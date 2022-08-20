import React, { createRef, useRef, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { Chessboard, Square } from 'react-chessboard';
import { Connection, Match, PeerActions } from './Connection';
import { Chess, Move, PartialMove } from 'chess.ts';
import LeftPanel from './LeftPanel';
import { Box, Grid, Stack } from '@mui/material';
import Challenges from './Challenges';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { RightPanel } from './RightPanel';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});


function App() {
  const [game, setGame] = useState(new Chess());
  const [orientation, setOrientation] = useState<"white" | "black">("white")

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
    if (game.turn() !== orientation.charAt(0)) {
      return false;
    }
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
  function startMatch(match: Match, username: string) {
    setOrientation(match.white === username ? "white" : "black");
  }
  return <ThemeProvider theme={darkTheme}>
    <CssBaseline></CssBaseline>
    <header className="App-header">
      <h1>Computer Chess</h1>
      <h6>"The next lichess"-nobody ever</h6></header>

    <Grid>
      <Grid container className='App' justifyContent={'center'} spacing={2} padding={10}>
        <LeftPanel></LeftPanel>
        <Grid item flex={2} order={{ lg: 1, xs: 1, sm: 2 }} className="board"><Chessboard boardOrientation={orientation} position={game.fen()} onPieceDrop={onDrop} /></Grid>
        <RightPanel></RightPanel>
        {/* <Connection startMatch={startMatch} ref={peerRef} makeMove={makeAMove}></Connection> */}
      </Grid >

      <Challenges />
    </Grid>;
  </ThemeProvider>
}
export type MyMove = string | PartialMove;
export default App;
