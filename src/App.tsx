import React, { createRef, useEffect, useRef, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { Chessboard, Pieces, Square } from 'react-chessboard';
import { Match } from './Connection';
import { Chess, Move, PartialMove, PieceSymbol } from 'chess.ts';
import { Box, Grid, Stack, Typography } from '@mui/material';
import Challenges from './Challenges';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Controller, RightPanelActions, RightPanel } from './RightPanel';
import { isElementAccessExpression } from 'typescript';
import LeftPanel from './LeftPanel';
import { challengeeee, createChallenges } from './Challenger';
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});
export interface Score {
  myScore: number;
  opponentScore: number;
}
function getSound(name: string) {
  return new Audio(require("./sounds/" + name + ".wav"))
}

class _SoundManager {
  start = getSound('game-start');
  gameOver = getSound('game-end');
  move = getSound('self-move');
  capture = getSound('capture');
  fail = getSound('fail');
  constructor() {
    this.fail.volume = .7
  }
}
const SoundManager = new _SoundManager();
type AppState = {
  game: Chess;
  orientation: "white" | "black";
  score: Score;
  isPlaying: boolean;
}


function newScore() {
  return { myScore: 0, opponentScore: 0 }
}
class App extends React.Component<{}, AppState> {

  rightPanel: React.RefObject<RightPanelActions>;
  leftPanel: React.RefObject<LeftPanel & any>;
  bottomPanel: React.RefObject<Challenges>;
  controller: Controller = {
    makeMove: (m) => this.makeMove(m),
    startMatch: (m, u) => this.startMatch(m, u),
    addOpponentScore: (addToScore) => {
      this.addToScore(0, addToScore);
    },
  }
  constructor(props: {}) {
    super(props);
    this.rightPanel = createRef();
    this.leftPanel = createRef();
    this.bottomPanel = createRef();
    this.state = { game: new Chess(), orientation: "white", score: newScore(), isPlaying: false };
  }
  componentDidMount(): void {
    this.setState({ game: new Chess(), orientation: "white", score: newScore(), isPlaying: false });
  }
  makeMove(move: MyMove, checkLegal: boolean = false) {
    console.log('making move', move);
    const sounder = (game: Chess) => {
      this.rightPanel.current?.anyMoveMade(move);
      if (game.get(move.to)) {
        SoundManager.capture.play();
      } else {
        SoundManager.move.play()
      }
      if (this.isGameOver()) {
        this.setState({ ...this.state, isPlaying: false })
        SoundManager.gameOver.play();
      }
    }
    if (checkLegal) {
      const gameCopy = new Chess(this.state.game.fen());
      const result = gameCopy.move(move);
      if (result) {
        this.setState(prev => { sounder(this.state.game); return { ...prev, game: gameCopy } });
        this.leftPanel.current!.madeMove(move, gameCopy, this.isGameOver())
      }
      return result;
    }
    this.setState(old => {
      const copy = new Chess(old.game.fen());
      const result = copy.move(move);
      sounder(old.game)
      return { ...old, game: copy }
    });
    return true; // null if the move was illegal, the move object if the move was legal
  }
  isGameOver(g: Chess = this.state.game) {
    return g.gameOver() || g.inDraw() || g.moves().length === 0;
  }
  onDrop(sourceSquare: Square, targetSquare: Square, piece: Pieces) {
    if (this.state.game.turn() !== this.state.orientation.charAt(0)) {
      return false;
    }
    const simple: PartialMove = {
      from: sourceSquare,
      to: targetSquare,
      // promotion: 'q' // always promote to a queen for example simplicity
    };
    if (piece.charAt(1) === 'P' && targetSquare.charAt(1) === '8' || targetSquare.charAt(1) === '1') {
      const options = ['n', 'b', 'r', 'q'];
      const promote = prompt("Enter piece type to promote to: " + options.join(" / "));
      if (!promote || !options.includes(promote)) {
        return false;
      }
      simple.promotion = promote as PieceSymbol;
    }

    const move = this.makeMove(simple, true);

    // illegal move
    if (move === null) return false;

    this.rightPanel.current?.sendMove(simple)
    // peerRef.current?.sendMove(move);
    return true;
  }
  startMatch(match: Match, username: string) {
    SoundManager.start.play();
    this.setState({ game: new Chess(), score: newScore(), orientation: match.white === username ? "white" : "black", isPlaying: true });
  }
  addToScore(addToMe: number, addToOpponent: number) {
    const oldScore = this.state.score;
    if (addToMe < 0 || addToOpponent < 0) {
      SoundManager.fail.play();
    }
    this.setState({ ...this.state, score: { myScore: oldScore.myScore + addToMe, opponentScore: oldScore.opponentScore + addToOpponent } });
    if (addToMe) {
      this.rightPanel.current?.sendAddScore(addToMe);
    }
  }
  render(): React.ReactNode {
    const THIS = this;
    if (this.state.orientation.charAt(0) === this.state.game.turn()) {
      this.bottomPanel.current && this.bottomPanel.current!.createChallenges(this.state.game);
      createChallenges(this.state.game).then(_c => {
        _c.forEach(c => {
          c.onFinish = challenge => {
            if (c.status === "success") {
              THIS.addToScore(challenge.reward, 0);
            } else {

              THIS.addToScore(-challenge.reward, 0);
            }
          }
          this.leftPanel.current?.setChallenge(c)
        })
      })
    }
    return <ThemeProvider theme={darkTheme}>
      <CssBaseline></CssBaseline>
      <header className="App-header">
        <h1>Computer Chess</h1>
        <h6>"The next lichess"-nobody ever</h6></header>

      {/* <Grid> */}
      <Grid container className='App' direction="row" spacing={2} margin={2} padding={10} justifyContent={'center'} >
        <LeftPanel ref={this.leftPanel}></LeftPanel>
        <Grid order={{ lg: 1, xs: 1, sm: 2 }} className={"board" + (this.state.isPlaying ? "" : " disabled")}>
          <Chessboard boardOrientation={this.state.orientation} position={this.state.game.fen()} onPieceDrop={(s, t, p) => THIS.onDrop(s, t, p)} />
        </Grid>
        <RightPanel ref={this.rightPanel} score={THIS.state.score} controller={THIS.controller}></RightPanel>
      </Grid >

      {/* </Grid>; */}
    </ThemeProvider >
  }

}
function Score({ num }: { num: number }) {
  return <Typography display={"block"} variant='h5'>{num}</Typography>
}
export type MyMove = PartialMove;
export default App;
