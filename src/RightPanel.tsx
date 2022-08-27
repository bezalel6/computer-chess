import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Grid, Input, Stack, TextField, Typography, TypographyProps } from "@mui/material";
import { convertLength } from "@mui/material/styles/cssUtils";
import Peer, { DataConnection } from "peerjs";
import { forwardRef, useState, useImperativeHandle, useCallback, useRef, ReactNode } from "react";
import { MyMove, Score } from "./App";
import { EventType, Match, MatchError, Message, Payload, MessageEventMap, Mapped } from "./Connection";
import { PanelInstance, Section } from "./LeftPanel";
import EventEmitter from "events"
import TypedEmitter from "typed-emitter"
import { useEffect } from "react";

export type GameEvents = {
    initGame: (match: Match) => void;
}


interface RightPanelProps {
    controller: Controller;
    score: Score;
}
export interface RightPanelActions {
    anyMoveMade: (move: MyMove) => void;
    sendMove: (move: MyMove) => void;
    sendAddScore: (add: number) => void;
}
const HOST = "localhost";
const PORT = 8000;

function Username(props: TypographyProps & { username: string, score: number | null }) {
    return <Typography {...props} variant="h6">{props.username + ((props.score !== null) ? (" " + props.score + " points") : (""))}</Typography>
}




const Emitter = new EventEmitter() as TypedEmitter<GameEvents>;
export const RightPanel =

    forwardRef<RightPanelActions, RightPanelProps>(({ controller, score }: RightPanelProps, ref) => {
        const [state, setState] = useState(new State());
        const [connection, setConnection] = useState<Connection>();

        useImperativeHandle(ref, () => ({
            sendMove(move) {
                connection?.sendMessage({ type: "move", data: move })
            },
            sendAddScore(add) {
                connection?.sendMessage({ type: "addToOpponentScore", data: add });
            },
            anyMoveMade(move) {
                setState(state.addMove(move))
            },
        }))

        function LoggedIn() {
            Emitter.addListener("initGame", (match) => {
                PanelInstance.logData("Starting Game");
                setState(_a => {
                    state.currentMatch = match;
                    return state.clone()
                })
            })
            function GetFriend({ submited }: { submited: (un: string | undefined) => void }) {
                const [open, setOpen] = useState(false);

                const handleClickOpen = () => {
                    setOpen(true);
                };

                const handleClose = () => {
                    setOpen(false);
                };
                const handleSubmit = () => {
                    const e = document.querySelector("#friend-un")! as HTMLInputElement;
                    if (!e.value)
                        return
                    submited(e.value);
                    handleClose()
                }

                return <div>
                    <Button variant="outlined" onClick={handleClickOpen}>
                        Play a Friend
                    </Button>
                    <Dialog open={open} onClose={handleClose}>
                        <DialogTitle>Play a friend</DialogTitle>
                        <DialogContent>
                            <DialogContentText>
                                Enter your friend's username
                            </DialogContentText>
                            <TextField
                                autoFocus
                                autoComplete="off"
                                margin="dense"
                                id="friend-un"
                                // label="Friend Username"
                                type="text"
                                fullWidth
                                variant="standard"
                            />
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleClose}>Cancel</Button>
                            <Button type="submit" onClick={handleSubmit}>Play</Button>
                        </DialogActions>
                    </Dialog>
                </div>
            }
            function NotPlaying() {
                return <Box>
                    <GetFriend submited={(un) => {
                        connection?.findMatch(un);
                    }}></GetFriend>
                    <Button onClick={() => { connection?.findMatch() }}>Find Match</Button></Box>
            }
            function Playing() {
                return <Stack height={"100%"} position={"relative"} direction="column">
                    <Username username={state.opponent} score={score.opponentScore}></Username>
                    <MoveLog moves={state.moves}></MoveLog>
                    <Username style={{ bottom: "0" }} username={state.username} score={score.myScore}></Username>
                </Stack>
            }
            return <Grid item display="block" height={"100%"} container direction={"column"}>
                <Typography variant="h6">Hello {state.prettyUsername}</Typography>
                {state.isPlaying ? <Playing></Playing> : <NotPlaying></NotPlaying>}
            </Grid>
        }
        function LogIn() {
            async function checkAvailable(un: string) {
                interface Available {
                    available: boolean;
                }
                return await fetch(`http://${HOST}:${PORT}/username/check/${un}`).then(res => res.json()).then((res) => {
                    return (res as unknown as Available).available;
                })
            }
            function login() {
                const username = (document.getElementById("un-in") as HTMLInputElement).value;
                if (username.match(/^[A-Za-z][A-Za-z0-9_]{4,29}$/)) {
                    checkAvailable(username).then(available => {
                        if (available) {
                            finishLogin(username);
                        } else {
                            alert(username + " is not available")
                        }
                    })
                } else {
                    alert(username + " is not a valid username")
                }
            }
            function guest() {
                const genUsername = async () => {
                    const a = await fetch(`http://${HOST}:${PORT}/username/rnd`, { mode: "cors" });
                    const n = (await a.text());
                    console.log(n);
                    return n;
                }
                genUsername().then(un => finishLogin(un, true))
            }
            function finishLogin(un: string, guest: boolean = false) {
                setConnection(_ => {

                    const conn = new Connection(un, controller);

                    return conn;
                });
                setState(state.login(un, guest));
            }
            return <Grid item container direction={"column"}>
                <Input id="un-in" type="text" placeholder="Username" />
                <Button onClick={login}>Login</Button>
                <Button onClick={guest}>Login As Guest</Button>
            </Grid>
        }

        return <Box order={3}>
            {state.loggedIn ? (<LoggedIn></LoggedIn>) : (<LogIn></LogIn>)}

        </Box>
    })

export const MoveLog =

    ({ moves }: { moves: MyMove[] }) => {
        return <Section title="Move Log">
            {moves.map((m, i) => <MoveComponent move={m} key={i}></MoveComponent>)}
        </Section>
    }
function MoveComponent({ move }: { move: MyMove }) {
    return <Typography>{move.from}+{move.to}</Typography>
}
interface StateInterface {
    loggedIn: boolean;
    isGuest: boolean;
    username: string;
    currentMatch?: Match;
    moves: MyMove[];

}
class State implements StateInterface {
    loggedIn: boolean;
    isGuest: boolean;
    username: string;
    currentMatch?: Match;
    moves: MyMove[];
    constructor({ loggedIn, isGuest, username, currentMatch, moves } = { loggedIn: false, isGuest: false, username: "", moves: [] } as StateInterface) {
        this.loggedIn = loggedIn;
        this.isGuest = isGuest;
        this.username = username; this.currentMatch = currentMatch;
        this.moves = moves;
    }
    login(username: string, guest: boolean = false) {
        this.loggedIn = true;
        this.username = username;
        this.isGuest = guest;
        return this.clone();
    }
    addMove(move: MyMove) {
        this.moves.push(move);
        return this.clone();
    }
    match(match: Match) {
        this.currentMatch = match;
        return this.clone();
    }
    clone() {
        return new State({ ...this })
    }
    get opponent() {
        if (!this.isPlaying) {
            throw "Not playing"
        }
        return this.username === this.currentMatch!.white ? this.currentMatch!.black : this.currentMatch!.white;
    }
    get isPlaying() {
        return !!this.currentMatch
    }
    get prettyUsername() {
        return this.loggedIn ? this.isGuest ? "Guest" : this.username : "Not Logged In Yet";
    }
}
export interface Controller {
    makeMove: (move: MyMove) => void;
    startMatch: (match: Match, username: string) => void;
    addOpponentScore: (addToScore: number) => void;
}

class Connection {
    pid: string;
    peer: Peer;
    connection!: DataConnection;
    controller: Controller;
    constructor(pid: string, controller: Controller) {
        this.controller = controller;
        this.pid = pid;
        this.peer = new Peer(pid, { host: HOST, path: "peer", port: PORT });
        this.peer.on("connection", con => { this.newCon(con, this) });
    }
    findMatch(matchWith?: string) {
        const add = matchWith ? "/" + matchWith : ""
        fetch(`http://${HOST}:${PORT}/match/${this.pid}` + add, { mode: "cors" }).then(res => res.json()).then((_res) => {

            console.log(_res);

            const res = _res as unknown as Match | MatchError;
            if ('error' in res) {
                PanelInstance.logError(res.error)
            } else {
                this.startMatch(res, true);
            }
        })
    }
    sendMessage<T extends EventType>(msg: Message<T>) {
        if (this.connection) {
            this.connection.send(msg);
        } else {

            PanelInstance.logError("cant send " + JSON.stringify(msg, null, 2) + ". not connected")
        }
    }
    startMatch(match: Match, connect: boolean = false) {
        console.log("starting game!!!");
        if (connect) {
            this.newCon(this.peer.connect(match.white === this.pid ? match.black : match.white), this).then(() => {
                console.log('thening');

                this.sendMessage({ type: "initGame", data: match })
            })
        }
        this.controller.startMatch(match, this.pid);
        Emitter.emit("initGame", match);
    }
    newCon(conn: DataConnection, myConn: Connection) {
        this.connection = conn;
        const THIS = this;
        return new Promise<DataConnection>((resolve, reject) => {
            conn.on('open', () => {
                console.log('conn open');
                conn.on('data', function (_data: unknown) {
                    const msg = _data as Message<any>;
                    console.log('data', msg);
                    const data = msg.data;
                    switch (msg.type) {
                        case "message": {
                            PanelInstance.addToLog(<Alert severity="info">{data}</Alert>)
                            break;
                        }
                        case "initGame": {
                            THIS.startMatch(msg.data as Match);
                            break;
                        }
                        case "move": {
                            THIS.controller.makeMove(msg.data as MyMove);
                            break;
                        }
                        case "addToOpponentScore": {
                            THIS.controller.addOpponentScore(msg.data as number);
                            break;
                        }
                        default: {
                            throw msg.type + " not implemented yet";
                        }
                    }
                });
                console.log('peer connected');
                resolve(conn);

            })
        })

    }
}