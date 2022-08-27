import * as A from 'circular-json'
import { AlertColor, Box, Divider, Grid, List, Stack, Typography, Alert, GridProps, Badge, Icon } from "@mui/material";
import React, { useEffect, useState } from "react";
import { MyMove } from "./App";
import Challenges, { Challenge, ChallengeComponent, checkChallenge } from "./Challenges";
import { Chess } from 'chess.ts';
import CloseIcon from '@mui/icons-material/Close';
interface LeftPanelState {
    challenges: Challenge[];
    log: JSX.Element[];
}
export let PanelInstance: LeftPanel;
export default class LeftPanel extends React.Component<GridProps, LeftPanelState> {
    state = {
        challenges: [],
        log: []
    }
    constructor(props: GridProps) {
        super(props);
        PanelInstance = this;
    }
    addChallenge(challenge: Challenge) {
        this.setState(prev => { return { challenges: [...prev.challenges, challenge], log: prev.log } })
    }
    setChallenge(challenge: Challenge) {
        this.setState(prev => { return { challenges: [challenge], log: prev.log } })
    }
    logData(data: string, severity: AlertColor = "info") {
        this.addToLog(<MyAlert txt={data} severity={severity}></MyAlert>)
    }
    addToLog(add: JSX.Element) {
        this.setState(prev => { return { challenges: prev.challenges, log: [...prev.log, add] } })
    }
    logDEBUG(txt: any) {
        const t = typeof txt === "string" ? txt :
            A.stringify(txt)
        this.addToLog(<MyAlert severity="success" txt={t}></MyAlert>)
    }
    logError(err: string) {
        console.log(err);

        this.addToLog(<MyAlert severity="error" txt={err}></MyAlert>)
    }
    madeMove(move: MyMove, newPosition: Chess, isGameOver: boolean) {
        this.setState(state => { return { challenges: checkChallenge(state.challenges, move, newPosition, isGameOver) } })
    }
    render() {
        {

            return <Grid {...this.props} item order={{ lg: 1, sm: 2, xs: 2 }}
                sx={{ border: 1 }}
            >
                <Section title="Current Challenges">
                    {this.state.challenges.map((a, index) => <AcceptedChallenge challenge={a} key={index} ></AcceptedChallenge>)}
                </Section>
                <Divider sx={{ marginLeft: -2 }}></Divider>
                <Section title="Log">
                    {this.state.log.map((c, i) => <div key={i}>{c}</div>)}
                </Section>
            </Grid>
        }
    }
}
export function Section({ title, children }: { title: string, children?: JSX.Element[] }) {
    const height = 200;
    return (<Stack sx={{ border: 1 }} direction={"column"} marginRight={2}>
        <Typography variant="h5">
            {title}
        </Typography>
        <Divider ></Divider>
        <List style={{ maxHeight: height, minHeight: height, overflow: 'auto' }}>
            {children}
        </List>
    </Stack>)
}

function AcceptedChallenge({ challenge }: { challenge: Challenge }) {
    return <ChallengeComponent challenge={{ ...challenge, mandatory: "accepted" }}></ChallengeComponent>
}

function MyAlert({ severity, txt }: { severity: AlertColor, txt: string }) {
    const key = new Date().getTime();
    return <Alert key={key} severity={severity} >{txt}</Alert>
}
