import { Box, Button, Grid, Input } from "@mui/material";
import Peer, { DataConnection } from "peerjs";
import { forwardRef, useState, useImperativeHandle } from "react";
import { MyMove } from "./App";
import { Match, MatchError, Message } from "./Connection";
import { addToLog } from "./LeftPanel";

interface PanelProps {
    controller: Controller;
}
interface PanelActions {
}
const HOST = "localhost";
const PORT = 8000;
export const RightPanel = forwardRef<PanelActions, PanelProps>(({ controller }: PanelProps, ref) => {
    const [state, setState] = useState(new State());
    const [connection, setConnection] = useState<Connection>();
    useImperativeHandle(ref, () => ({

    }))

    function LoggedIn() {
        return <h4>Hello {state.prettyUsername}</h4>
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
                const a = await fetch(`http://${HOST}:${PORT}/username/rnd`, { mode: "no-cors" });
                return (await a.text());
            }
            genUsername().then(un => finishLogin(un, true))
        }
        function finishLogin(un: string, guest: boolean = false) {
            setConnection(new Connection(un, controller));
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

interface StateInterface {
    loggedIn: boolean;
    isGuest: boolean;
    username: string;
    currentMatch?: Match;
}
class State implements StateInterface {
    loggedIn: boolean;
    isGuest: boolean;
    username: string;
    currentMatch?: Match;
    constructor({ loggedIn, isGuest, username, currentMatch } = { loggedIn: false, isGuest: false, username: "" } as StateInterface) {
        this.loggedIn = loggedIn;
        this.isGuest = isGuest;
        this.username = username; this.currentMatch = currentMatch;
    }
    login(username: string, guest: boolean = false) {
        this.loggedIn = true;
        if (!guest) this.username = username;
        else this.isGuest = true;
        return this.clone();
    }
    match(match: Match) {
        this.currentMatch = match;
        return this.clone();
    }
    clone() {
        return new State({ loggedIn: this.loggedIn, isGuest: this.isGuest, username: this.username, currentMatch: this.currentMatch })
    }
    get prettyUsername() {
        return this.loggedIn ? this.isGuest ? "Guest" : this.username : "Not Logged In Yet";
    }
}
export interface Controller {
    makeMove: (move: MyMove) => void;
    startMatch: (match: Match) => void;
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
    }
    findMatch(matchWith?: string) {
        fetch(`http://${HOST}:${PORT}/match/${this.pid}`, { mode: "cors" }).then(res => res.json()).then((_res) => {

            console.log(_res);

            const res = _res as unknown as Match | MatchError;
            if ('error' in res) {
                alert("error " + res.error)
            } else {
                this.startMatch(res, true);
            }
        })
    }
    sendMessage(msg: Message) {
        if (this.connection) {
            this.connection.send(msg);
        } else {
            console.log('no connection to send', msg);

        }
    }
    startMatch(match: Match, connect: boolean = false) {
        console.log("starting game!!!");
        if (connect) {
            this.newCon(this.peer.connect(match.white === this.pid ? match.black : match.white)).then(() => {
                this.sendMessage({ type: "init-game", data: match })
            })
        }
        this.controller.startMatch(match);

    }
    newCon(conn: DataConnection) {
        this.connection = conn;
        const init = this.startMatch;
        return new Promise<DataConnection>((resolve, reject) => {
            conn.on('open', () => {
                console.log('conn open');
                conn.on('data', (_data) => {
                    const data = _data as Message;
                    console.log('data', data);

                    switch (data.type) {
                        case "message": {
                            addToLog(data.data as string);
                            break;
                        }
                        case "init-game": {
                            init(data.data as Match);
                            break;
                        }
                        case "move": {
                            this.controller.makeMove(data.data as string);
                        }
                    }
                });
                console.log('peer connected');
                resolve(conn);

            })
        })

    }
}