import Peer, { DataConnection } from "peerjs";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { MyMove } from "./App";
export type MoveMaker = (move: MyMove) => void;
let mover: MoveMaker;
let connection: DataConnection | null;

export interface PeerActions {
    sendMove: (move: MyMove) => void;
}
export const Init = forwardRef<PeerActions, { makeMove: MoveMaker }>(({ makeMove }: { makeMove: MoveMaker }, ref) => {
    mover = makeMove;
    useImperativeHandle(ref, () => ({
        sendMove(move: MyMove) {
            console.log('sending', move);
            sendMessage({ type: "move", data: move })
        }
    }))
    const peer = new Peer();
    peer.on('connection', newCon);
    const [pid, setPid] = useState('');

    useEffect(() => {
        const e = document.getElementById("pid-container")!;

        e.onclick = () => {
            const ee = document.getElementById("pid")!;
            window.getSelection()?.selectAllChildren(ee);
            navigator.clipboard.writeText(ee.innerText);
        }
        peer.on('open', function (id) {
            setPid(id);
            const form = document.querySelector("#form") as HTMLFormElement;
            form.onsubmit = (e) => {
                e.preventDefault();
                const connectTo = getOther().value
                console.log('connecting to', connectTo);

                newCon(peer.connect(connectTo));

            }


        });


    }, [])
    function getOther() {
        return document.querySelector("#other-pid")! as HTMLInputElement
    }
    return (<>
        <div id="pid-container">
            your pid is
            <div id="pid">{pid}</div>
        </div>
        <br />
        <form action="" id="form" autoComplete="off"><label htmlFor="other-pid">Other: </label>
            <input required id="other-pid" name="other-pid" type="text" /><button onClick={() => {
                navigator.clipboard.readText().then(txt => { getOther().value = txt });
            }}>Paste from clipboard</button>
            <br />
            <button type="submit">Connect</button>
        </form>
        <button id="test">TTTTT</button>
    </>)

}
)
interface Message {
    type: "message" | "move";
    data: string | MyMove;
}
function newCon(conn: DataConnection) {
    connection = conn;
    conn.on('open', () => {
        console.log('conn open');
        conn.on('data', function (_data) {
            const data = _data as Message;
            console.log('data', data);

            switch (data.type) {
                case "message": {
                    alert(data.data);
                    break;
                }
                case "move": {
                    mover(data.data);
                }
            }
        });
        console.log('peer connected');


        document.getElementById('test')!.onclick = () => {
            console.log("testing");
            sendMessage({ type: "message", data: "hello" });

        }
    })
}
function sendMessage(msg: Message) {
    if (connection) {
        connection.send(msg);
    } else {
        console.log('no connection to send', msg);

    }
}