import { Room, } from "colyseus";
import { BattleState, PlayerState, } from "../schema/BattleState.js";
// ============================================================
// BATTLE ROOM
// ============================================================
export class BattleRoom extends Room {
    constructor() {
        // ========================================================
        // CONFIG
        // ========================================================
        super(...arguments);
        this.maxClients = 10;
        // ========================================================
        // STATE
        // ========================================================
        this.state = new BattleState();
    }
    // ========================================================
    // CREATE ROOM
    // ========================================================
    onCreate(options) {
        console.log(`[ROOM] Created: ${this.roomId}`);
        // ----------------------------------------------------
        // ROOM CODE
        // ----------------------------------------------------
        this.state.roomCode =
            this.roomId;
        // ----------------------------------------------------
        // MOVE MESSAGE
        // ----------------------------------------------------
        this.onMessage("move", (client, message) => {
            const player = this.state.players.get(client.sessionId);
            if (!player) {
                return;
            }
            // --------------------------------------------
            // X
            // --------------------------------------------
            if (typeof message?.x === "number") {
                player.x =
                    message.x;
            }
            // --------------------------------------------
            // Y
            // --------------------------------------------
            if (typeof message?.y === "number") {
                player.y =
                    message.y;
            }
            // --------------------------------------------
            // Z
            // --------------------------------------------
            if (typeof message?.z === "number") {
                player.z =
                    message.z;
            }
            // --------------------------------------------
            // ROTATION
            // --------------------------------------------
            if (typeof message?.rotation === "number") {
                player.rotation =
                    message.rotation;
            }
        });
    }
    // ========================================================
    // PLAYER JOIN
    // ========================================================
    onJoin(client, options) {
        console.log(`[ROOM] Player joined: ${client.sessionId}`);
        // ----------------------------------------------------
        // CREATE PLAYER
        // ----------------------------------------------------
        const player = new PlayerState();
        player.id =
            client.sessionId;
        player.name =
            options?.name ||
                `Player ${this.state.players.size + 1}`;
        // ----------------------------------------------------
        // SPAWN POSITION
        // ----------------------------------------------------
        const playerIndex = this.state.players.size;
        player.x =
            playerIndex * 3;
        player.y =
            0;
        player.z =
            0;
        // ----------------------------------------------------
        // PLAYER STATE
        // ----------------------------------------------------
        player.rotation =
            0;
        player.hp =
            100;
        player.alive =
            true;
        // ----------------------------------------------------
        // ADD TO ROOM
        // ----------------------------------------------------
        this.state.players.set(client.sessionId, player);
        console.log(`[ROOM] Players: ${this.state.players.size}`);
    }
    // ========================================================
    // PLAYER LEAVE
    // ========================================================
    onLeave(client, code) {
        console.log(`[ROOM] Player left: ${client.sessionId}`);
        this.state.players.delete(client.sessionId);
        console.log(`[ROOM] Players: ${this.state.players.size}`);
    }
    // ========================================================
    // DISPOSE
    // ========================================================
    onDispose() {
        console.log(`[ROOM] Disposed: ${this.roomId}`);
    }
}
//# sourceMappingURL=BattleRoom.js.map