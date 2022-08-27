import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField } from "@mui/material";
import React from "react";
import { ReactNode } from "react";

export default class GameOver extends React.Component<{}, { isOpen: boolean, myScore: number, opponentScore: number }> {
    close() {
        this.setState({ ...this.state, isOpen: false });
    }
    gameOver(myScore: number, opponentScore: number) {
        this.setState({ isOpen: true, myScore, opponentScore })
    }
    render(): ReactNode {
        return <Dialog open={this.state.isOpen} onClose={this.close}>
            <DialogTitle>Game Over</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {this.state.myScore > this.state.opponentScore ? "You Won!" : this.state.myScore < this.state.opponentScore ? "You Lost" : "Its a draw"}
                </DialogContentText>
                <DialogContentText>
                    You scored {this.state.myScore} and your opponent scored {this.state.opponentScore}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={this.close}>Cancel</Button>
            </DialogActions>
        </Dialog>
    }
}