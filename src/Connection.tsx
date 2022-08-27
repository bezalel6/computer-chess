import { Box, Button, Grid, Input, Typography } from "@mui/material";
import Peer, { DataConnection } from "peerjs";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { MyMove } from "./App";
export type MoveMaker = (move: MyMove) => void;
let mover: MoveMaker;
let connection: DataConnection | null;
const HOST = "localhost";
const PORT = 8000;
export interface PeerActions {
    sendMove: (move: MyMove) => void;
    getUsername: () => string;
}
interface Props {
    makeMove: MoveMaker;
    startMatch: (match: Match, username: string) => void;
}
// export const Connection = forwardRef<PeerActions, Props>(({ makeMove, startMatch }: Props, ref) => {
//     mover = makeMove;
//     useImperativeHandle(ref, () => ({
//         sendMove(move: MyMove) {
//             console.log('sending', move);
//             sendMessage({ type: "move", data: move })
//         },
//         getUsername() {
//             return username;
//         },
//     }))
//     const destroyer: (() => void)[] = []
//     const [pid, setPid] = useState('');
//     let peer: Peer;
//     useEffect(() => {
//         genUsername().then(un => {
//             username = un;
//             peer = new Peer(un, { host: HOST, path: "peer", port: PORT });
//             destroyer.push(peer.disconnect);
//             document.getElementById("rnd-match")!.onclick = () => {
//                 console.log('fetching', un);

//                 fetch(`http://${HOST}:${PORT}/match/${username}`, { mode: "cors" }).then(res => res.json()).then((_res) => {

//                     console.log(_res);

//                     const res = _res as unknown as Match | MatchError;
//                     if ('error' in res) {
//                         alert("error " + res.error)
//                     } else {
//                         initMatch(res, true);
//                     }
//                 })
//             }
//             peer.listAllPeers((p) => {
//                 console.log('peers', p);

//             })
//             peer.on('connection', newCon);
//             const e = document.getElementById("pid-container")!;

//             e.onclick = () => {
//                 const ee = document.getElementById("pid")!;
//                 window.getSelection()?.selectAllChildren(ee);
//                 navigator.clipboard.writeText(ee.innerText);
//             }
//             peer.on('open', function (id) {
//                 setPid(id);
//                 username = id;
//                 const form = document.querySelector("#form") as HTMLFormElement;
//                 form.onsubmit = (e) => {
//                     e.preventDefault();
//                     const connectTo = getOther().value
//                     console.log('connecting to', connectTo);

//                     newCon(peer.connect(connectTo));

//                 }


//             });

//         })
//         return () => destroyer.forEach(a => a())

//     }, [])
//     function initMatch(match: Match, connect: boolean = false) {
//         console.log("starting game!!!");
//         if (connect) {
//             newCon(peer.connect(match.white === username ? match.black : match.white)).then(() => {
//                 sendMessage({ type: "init-game", data: match })
//             })
//         }
//         startMatch(match, username);
//     }

//     function newCon(conn: DataConnection) {
//         connection = conn;
//         return new Promise<DataConnection>((resolve, reject) => {
//             conn.on('open', () => {
//                 console.log('conn open');
//                 conn.on('data', function (_data) {
//                     const data = _data as Message;
//                     console.log('data', data);

//                     switch (data.type) {
//                         case "message": {
//                             alert(data.data);
//                             break;
//                         }
//                         case "init-game": {
//                             initMatch(data.data as Match);
//                             break;
//                         }
//                         case "move": {
//                             mover(data.data as string);
//                         }
//                     }
//                 });
//                 console.log('peer connected');
//                 resolve(conn);

//             })
//         })

//     }
//     function sendMessage(msg: Message) {
//         if (connection) {
//             connection.send(msg);
//         } else {
//             console.log('no connection to send', msg);

//         }
//     }
//     function getOther() {
//         return document.querySelector("#other-pid")! as HTMLInputElement
//     }
//     return (<Grid item order={3}>
//         <Typography variant="h6" id="pid-container">
//             Hello<Typography id="pid">{pid}</Typography>
//         </Typography>
//         <form action="" id="form" autoComplete="off"><label htmlFor="other-pid">Other: </label>
//             <Input required id="other-pid" name="other-pid" type="text" />
//             <Button type="submit">Connect</Button>
//         </form>
//         <Button id="rnd-match">find match</Button>
//     </Grid>)

// }
// )
const genUsername = async () => {
    const a = await fetch(`http://${HOST}:${PORT}/username/rnd`, { mode: "no-cors" });
    return (await a.text());
}
export interface Message<T extends EventType> {
    type: T;
    data: Payload<T>;
}

export interface MessageEventMap {
    message: string;
    move: MyMove;
    initGame: Match;
    addToOpponentScore: number;
}

export type EventType = keyof MessageEventMap;
export type Payload<T extends EventType> = MessageEventMap[T];

const a: Payload<"message"> = "hello";
// const a:Mapped[EventType] = 

// a bit of love for TypeScript
export type Mapped = {
    [P in keyof MessageEventMap]: {
        type: P, data: MessageEventMap[P]
    }
}
function on<T extends EventType>(type: T, callback: (data: Payload<T>) => void) { }

function onEvent(callback: (ev: Mapped[EventType]) => void) { }

let username: string;
export interface Match {
    white: string;
    black: string;
}
export interface MatchError {
    error: string;
}