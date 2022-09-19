import { Avatar, Box, Button, Card, CardActions, CardContent, Grid, Tooltip, Typography } from "@mui/material";
import { Chess, Move, PartialMove } from "chess.ts";
import React, { createRef, forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { MyMove } from "./App";
import { PanelInstance } from "./LeftPanel";
import CloseIcon from '@mui/icons-material/Close'
import DoneIcon from '@mui/icons-material/Done';
import { createChallenges, MoveScore } from "./Challenger";

// const demoChallenge: Challenge = {
//     name: "Best Move",
//     mandatory: "optional",
//     description: "Play the best move in this position",
//     checkChallenge: (m) => {
//         return typeof m !== "string" && m.from === "e2" && m.to === "e4"
//     },
//     status: "possible",
//     ttp: "Turn"
// }


type Props = {}
export default class Challenges extends React.Component<Props, { challenges: Challenge[] }>{
    state = { challenges: [] }
    constructor(props: Props) {
        super(props);
    }
    componentDidMount(): void {
        // this.setState({ challenges: [demoChallenge] })
    }
    createChallenges(position: Chess) {
        console.log('about to fetch challenges');

        createChallenges(position).then(c => {
            console.log('setting challenges', c);

            this.setState({ challenges: c });
        })
    }
    render(): React.ReactNode {
        return <Grid container spacing={2} padding={10}>
            {
                this.state.challenges.map((c, i) => <ChallengeComponent challenge={c} key={i} />)
            }
        </Grid>
    }
}


export type ChallengeTerms = {
    /**
     * an array of the correct moves
     */
    correctMoves: MoveOption[];
};
export type MoveOption = MoveScore;
export interface Challenge {
    name: string;
    description: string;
    checkChallenge: ChallengeTerms;

    onFinish?: (c: Challenge) => void;
}
export function equals(m1: MyMove, m2: string) {
    return convertMoveToStr(m1) === m2;
}


export function convertMoveToStr(move: PartialMove) {

    return move.from + move.to + (move.promotion ? "=" + move.promotion : "");
}
export interface ChallengeActions {
}
export interface ChallengeProps {
    challenge: Challenge;
}
export const ChallengeComponent = forwardRef<ChallengeActions, ChallengeProps>(({ challenge }: ChallengeProps, ref) => {

    return (
        <Box sx={{ minWidth: 275 }}>
            <Card variant="outlined">
                <React.Fragment>

                    <CardContent>
                        {/* <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                                Stakes: {Reward[challenge.reward]}
                            </Typography> */}
                        <Typography variant="h5" component="div">
                            {challenge.name}
                        </Typography>

                        <Typography variant="body2">
                            {challenge.description}
                        </Typography>
                        <pre>{JSON.stringify(challenge.checkChallenge, null, 2)}</pre>
                    </CardContent>

                </React.Fragment>
            </Card>
        </Box>
    );
})