import { Box, Button, Card, CardActions, CardContent, Grid, Typography } from "@mui/material";
import React, { createRef, forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { addChallenge } from "./LeftPanel";

export default function Challenges() {
    const [challenges, setChallenges] = useState<JSX.Element[]>([])
    useEffect(() => {
        setChallenges([<ChallengeComponent key={0} challenge={{ name: "best move", reward: Reward.Pawn, mandatory: "optional", description: "play the best move in this position", }}></ChallengeComponent>])
    }, [])
    return <Grid container spacing={2} padding={10}>
        {
            challenges
        }
    </Grid>
}
export interface Challenge {
    name: string;
    description: string;
    reward: Reward;
    mandatory: "mandatory" | "optional" | "accepted";

}
export enum Reward {
    Pawn, Queen, Win
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
    return (
        <Box sx={{ minWidth: 275 }}>
            <Card variant="outlined">
                <React.Fragment>
                    <CardContent>
                        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                            Stakes: {Reward[challenge.reward]}
                        </Typography>
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
                    </CardContent>
                    {isAccepted ||
                        <CardActions>
                            <Button size="small" onClick={() => {
                                setAccepted(true);
                                addChallenge(challenge)
                                addChallenge(challenge)
                                addChallenge(challenge)
                                addChallenge(challenge)
                            }}>accept</Button>
                        </CardActions>}
                </React.Fragment>
            </Card>
        </Box>
    );
})