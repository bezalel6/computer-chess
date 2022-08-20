import { Box, Divider, Grid, List, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { MyMove } from "./App";
import { Challenge, ChallengeComponent } from "./Challenges";
type Setter = (value: React.SetStateAction<JSX.Element[]>) => void;
let currentChallengesSETTER: Setter, logSETTER: Setter;
export default function Panel() {
    const [currentChallenges, setCurrentChallenges] = useState<JSX.Element[]>([]);
    useEffect(() => {
        currentChallengesSETTER = setCurrentChallenges;
    }, [currentChallenges, setCurrentChallenges])
    const [log, setLog] = useState<JSX.Element[]>([]);
    useEffect(() => {
        logSETTER = setLog;
    }, [log, setLog])
    return <Grid item flex={1} order={{ lg: 1, sm: 2, xs: 2 }}
        sx={{ border: 1 }}
    >
        <Section title="Current Challenges">
            {currentChallenges}
        </Section>
        <Divider sx={{ marginLeft: -2 }}></Divider>
        <Section title="Log">
            {log}
        </Section>
    </Grid>
}
function Section({ title, children }: { title: string, children?: JSX.Element[] }) {
    return (<Stack direction={"column"} marginRight={2}>
        <Typography variant="h5">
            {title}
        </Typography>
        <Divider ></Divider>
        <List style={{ maxHeight: 200, overflow: 'auto' }}>
            {children}
        </List>
    </Stack>)
}
export function addChallenge(challenge: Challenge) {
    currentChallengesSETTER(arr => [...arr, <AcceptedChallenge challenge={challenge}></AcceptedChallenge>])
}
function AcceptedChallenge({ challenge }: { challenge: Challenge }) {
    return <ChallengeComponent challenge={{ ...challenge, mandatory: "accepted" }}></ChallengeComponent>
}
export function addToLog(txt: string) {
    logSETTER(arr => [...arr, <p>{txt}</p>])
}
export function addToMoveLog(move: MyMove) {

}
