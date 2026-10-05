
import {
    Client,
    Room,
    type RoomOptions,
} from "colyseus";

import {
    BattleState,
    PlayerState,
} from "../schema/BattleState.js";


// ============================================================
// TYPES
// ============================================================

interface BattleRoomOptions extends RoomOptions {
    name?: string;
    roomCode?: string;
}


// ============================================================
// ROOM CODE
// ============================================================

function generateRoomCode(): string {
    return Math.floor(
        100000 + Math.random() * 900000
    ).toString();
}


// ============================================================
// BATTLE ROOM
// ============================================================

export class BattleRoom extends Room<{
    state: BattleState;
}> {

    maxClients = 10;

    state = new BattleState();


    // ========================================================
    // CREATE
    // ========================================================

    onCreate(
        options: BattleRoomOptions
    ) {

        console.log(
            `[ROOM] Created: ${this.roomId}`
        );


        // ----------------------------------------------------
        // ROOM CODE
        // ----------------------------------------------------

        const roomCode =
            options?.roomCode ||
            generateRoomCode();

        this.state.roomCode =
            roomCode;


        console.log(
            `[ROOM] Code: ${this.state.roomCode}`
        );


        // ----------------------------------------------------
        // MOVE
        // ----------------------------------------------------

        this.onMessage(
            "move",
            (
                client,
                message
            ) => {

                const player =
                    this.state.players.get(
                        client.sessionId
                    );

                if (!player) {
                    return;
                }


                if (
                    typeof message?.x ===
                    "number"
                ) {
                    player.x =
                        message.x;
                }


                if (
                    typeof message?.y ===
                    "number"
                ) {
                    player.y =
                        message.y;
                }


                if (
                    typeof message?.z ===
                    "number"
                ) {
                    player.z =
                        message.z;
                }


                if (
                    typeof message?.rotation ===
                    "number"
                ) {
                    player.rotation =
                        message.rotation;
                }
            }
        );
    }


    // ========================================================
    // JOIN
    // ========================================================

    onJoin(
        client: Client,
        options: BattleRoomOptions
    ) {

        console.log(
            `[ROOM] Player joined: ${client.sessionId}`
        );


        const player =
            new PlayerState();


        player.id =
            client.sessionId;


        player.name =
            options?.name ||
            `Player ${
                this.state.players.size + 1
            }`;


        const playerIndex =
            this.state.players.size;


        // ----------------------------------------------------
        // SPAWN
        // ----------------------------------------------------

        player.x =
            playerIndex * 3;

        player.y =
            0;

        player.z =
            0;

        player.rotation =
            0;


        // ----------------------------------------------------
        // STATS
        // ----------------------------------------------------

        player.hp =
            100;

        player.alive =
            true;


        this.state.players.set(
            client.sessionId,
            player
        );


        console.log(
            `[ROOM] Players: ${this.state.players.size}`
        );
    }


    // ========================================================
    // LEAVE
    // ========================================================

    onLeave(
        client: Client,
        code?: number
    ) {

        console.log(
            `[ROOM] Player left: ${client.sessionId}`
        );


        this.state.players.delete(
            client.sessionId
        );


        console.log(
            `[ROOM] Players: ${this.state.players.size}`
        );
    }


    // ========================================================
    // DISPOSE
    // ========================================================

    onDispose() {

        console.log(
            `[ROOM] Disposed: ${this.roomId}`
        );
    }
}
