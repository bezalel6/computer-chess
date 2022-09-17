import { Avatar, Box, Button, Card, CardActions, CardContent, Grid, Tooltip, Typography } from "@mui/material";
import { Chess, Move, PartialMove } from "chess.ts";
import React, { createRef, forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { MyMove } from "./App";
import { PanelInstance } from "./LeftPanel";
import CloseIcon from '@mui/icons-material/Close'
import DoneIcon from '@mui/icons-material/Done';
import { createChallenges, MoveScore } from "./Challenger";
export enum Reward {
    Pawn, Queen, Win
}

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

export type TimeToPlay = "Turn" | "Game" | "10 moves";

export type ChallengeTerms = {
    challengeType: "any option" | "dynamic relative to best option";
    /**
     * an array of the correct moves
     */
    correctMoves: MoveOption[];
};
export type MoveOption = MoveScore;
export interface Challenge extends PartialChallenge {
    calculateReward: (movePlayed: MyMove) => number;

}export interface PartialChallenge {
    name: string;
    description: string;
    mandatory: "mandatory" | "optional" | "accepted";
    ttp: TimeToPlay;
    checkChallenge: ChallengeTerms;
    status: "possible" | "fail" | "success";

    onFinish?: (c: Challenge) => void;
}
export function equals(m1: MyMove, m2: string) {
    return convertMoveToStr(m1) === m2;
}
export function checkChallenge(challenges: Challenge[], move: MyMove, newPosition: Chess, isGameOver: boolean) {
    challenges.forEach(c => {
        if (c.status === "possible") {
            const t = eachChallenge(c);
            switch (t) {
                case true: {
                    c.status = "success";
                    if (c.onFinish) {
                        c.onFinish(c);
                    }
                    break;
                }
                case false: {
                    c.status = "fail";
                    if (c.onFinish) {
                        c.onFinish(c);
                    }
                    break;
                }
                case "still possible": {
                    break;
                }
            }
        }
    })
    function eachChallenge(challenge: Challenge): boolean | "still possible" {
        const currentCheck = () => {
            return challenge.checkChallenge.correctMoves.find(m => equals(move, m.move.move));
        }
        if (currentCheck()) return true;

        switch (challenge.ttp) {
            case "Game": {
                return (isGameOver ? false : "still possible");
            }
            case "Turn": {
                return false;
            }
            default: {
                throw "Not implemented yet"
            }
        }
    }
    return challenges;

}

export function convertMoveToStr(move: PartialMove) {

    return move.from + move.to + (move.promotion ? "=" + move.promotion : "");
}
export interface ChallengeActions {
    getAccepted: () => boolean;
}
export interface ChallengeProps {
    challenge: Challenge;
}
export const ChallengeComponent = forwardRef<ChallengeActions, ChallengeProps>(({ challenge }: ChallengeProps, ref) => {

    const [isAccepted, setAccepted] = useState(challenge.mandatory !== "optional")
    useImperativeHandle(ref, () => ({
        getAccepted() {
            return isAccepted;
        },
    }))
    let icon = challenge.status === "fail" ? <CloseIcon /> : challenge.status === "possible" ? null : <DoneIcon />;
    let tooltip = (function () {
        console.log("efjkl");

        switch (challenge.status) {
            case "fail": {
                return "you failed this challenge"
            }
            case "possible": {
                return ""
            }
            case "success": {
                return ""
            }
        }
    }());

    return (
        <Box sx={{ minWidth: 275 }}>
            <Card variant="outlined">
                <React.Fragment>
                    <Tooltip title={tooltip}>

                        <CardContent>
                            {icon && <Avatar>{icon}</Avatar>}
                            {/* <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                                Stakes: {Reward[challenge.reward]}
                            </Typography> */}
                            <Typography variant="h5" component="div">
                                {challenge.name}
                            </Typography>
                            {challenge.mandatory !== "accepted" &&
                                <Typography sx={{ mb: 1.5 }} color="text.secondary">
                                    {challenge.mandatory ? "mandatory" : "optional"}
                                </Typography>}
                            <Typography variant="body2">
                                {challenge.description}
                            </Typography>
                            <pre>{JSON.stringify(challenge.checkChallenge, null, 2)}</pre>
                        </CardContent>
                    </Tooltip>
                    {isAccepted ||
                        <CardActions>
                            <Button size="small" onClick={() => {
                                setAccepted(true);
                                PanelInstance.addChallenge(challenge)
                            }}>accept</Button>
                        </CardActions>}
                </React.Fragment>
            </Card>
        </Box>
    );
})