
import {
    Client,
    Room,
    type RoomOptions,
} from "colyseus";

import {
    BattleState,
    PlayerState,
    BombState,
} from "../schema/BattleState.js";


// ============================================================
// TYPES
// ============================================================

interface BattleRoomOptions extends RoomOptions {

    name?: string;

    roomCode?: string;

}


// ============================================================
// CONFIG
// ============================================================

const MAX_HP = 100;

const MATCH_DURATION = 180;

const RESPAWN_DELAY = 3000;

const BOMB_DELAY = 3000;

const BOMB_RADIUS = 4;

const BOMB_DAMAGE = 50;


// ============================================================
// ROOM CODE
// ============================================================

function generateRoomCode(): string {

    return Math.floor(
        100000 +
        Math.random() * 900000
    ).toString();

}


// ============================================================
// DISTANCE XZ
// ============================================================

function distanceXZ(
    x1: number,
    z1: number,
    x2: number,
    z2: number
): number {

    const dx =
        x1 - x2;

    const dz =
        z1 - z2;

    return Math.sqrt(
        dx * dx +
        dz * dz
    );

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
    // HOST
    // ========================================================

    private hostSessionId:
        string | null = null;


    // ========================================================
    // CREATE
    // ========================================================

    onCreate(
        options: BattleRoomOptions
    ) {

        console.log("");
        console.log(
            "================================================"
        );
        console.log(
            "[ROOM] CREATE"
        );
        console.log(
            `       roomId: ${this.roomId}`
        );
        console.log(
            "================================================"
        );


        // ====================================================
        // ROOM CODE
        // ====================================================

        const roomCode =
            options?.roomCode ||
            generateRoomCode();

        this.state.roomCode =
            roomCode;


        console.log(
            `[ROOM] Code: ${this.state.roomCode}`
        );


        // ====================================================
        // MATCH TIMER
        // ====================================================

        this.state.timeRemaining =
            MATCH_DURATION;

        this.state.gameOver =
            false;


        console.log(
            `[GAME] Match duration: ${MATCH_DURATION}s`
        );


        /*
         * Server authoritative timer.
         *
         * Mỗi 1 giây giảm 1.
         */

        this.clock.setInterval(
            () => {

                // --------------------------------------------
                // GAME ALREADY OVER
                // --------------------------------------------

                if (
                    this.state.gameOver
                ) {
                    return;
                }


                // --------------------------------------------
                // DECREASE TIMER
                // --------------------------------------------

                this.state.timeRemaining =
                    Math.max(
                        0,
                        this.state.timeRemaining - 1
                    );


                console.log(
                    `[GAME] Time remaining: ${this.state.timeRemaining}s`
                );


                // --------------------------------------------
                // GAME OVER
                // --------------------------------------------

                if (
                    this.state.timeRemaining <= 0
                ) {

                    this.state.timeRemaining =
                        0;

                    this.state.gameOver =
                        true;


                    console.log("");
                    console.log(
                        "================================================"
                    );
                    console.log(
                        "[GAME] ⏰ GAME OVER"
                    );
                    console.log(
                        "================================================"
                    );


                    /*
                     * Thông báo cho tất cả client.
                     */

                    this.broadcast(
                        "gameOver",
                        {
                            reason: "time",
                        }
                    );

                }

            },
            1000
        );


        // ====================================================
        // MOVE
        // ====================================================

        this.onMessage(
            "move",
            (
                client,
                message
            ) => {

                // --------------------------------------------
                // GAME OVER
                // --------------------------------------------

                if (
                    this.state.gameOver
                ) {
                    return;
                }


                const player =
                    this.state.players.get(
                        client.sessionId
                    );


                if (!player) {
                    return;
                }


                // --------------------------------------------
                // DEAD PLAYER
                // --------------------------------------------

                if (!player.alive) {
                    return;
                }


                // --------------------------------------------
                // POSITION
                // --------------------------------------------

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


                // --------------------------------------------
                // ROTATION
                // --------------------------------------------

                if (
                    typeof message?.rotation ===
                    "number"
                ) {

                    player.rotation =
                        message.rotation;

                }

            }
        );


        // ====================================================
        // PLANT BOMB
        // ====================================================

        this.onMessage(
            "plantBomb",
            (
                client
            ) => {

                console.log("");
                console.log(
                    "[BOMB TEST] plantBomb RECEIVED"
                );

                console.log(
                    `       sessionId: ${client.sessionId}`
                );


                // ============================================
                // GAME OVER
                // ============================================

                if (
                    this.state.gameOver
                ) {

                    console.log(
                        "[BOMB] ❌ Game already over"
                    );

                    return;
                }


                // ============================================
                // GET PLAYER
                // ============================================

                const player =
                    this.state.players.get(
                        client.sessionId
                    );


                if (!player) {

                    console.log(
                        `[BOMB] ❌ Player not found: ${client.sessionId}`
                    );

                    return;
                }


                console.log(
                    `[BOMB] Player: ${player.name}`
                );

                console.log(
                    `[BOMB] Player position: ${player.x}, ${player.y}, ${player.z}`
                );

                console.log(
                    `[BOMB] Player HP: ${player.hp}`
                );

                console.log(
                    `[BOMB] Player alive: ${player.alive}`
                );


                // ============================================
                // DEAD PLAYER
                // ============================================

                if (!player.alive) {

                    console.log(
                        `[BOMB] ❌ Dead player cannot plant bomb`
                    );

                    return;
                }


                // ============================================
                // BOMB ID
                // ============================================

                const bombId =
                    `${client.sessionId}-${Date.now()}`;


                // ============================================
                // CREATE BOMB
                // ============================================

                const bomb =
                    new BombState();


                bomb.id =
                    bombId;

                bomb.ownerId =
                    client.sessionId;

                bomb.bombType =
                    "normal";


                // ============================================
                // BOMB POSITION
                // ============================================

                bomb.x =
                    player.x;

                bomb.y =
                    player.y;

                bomb.z =
                    player.z;


                // ============================================
                // BOMB CONFIG
                // ============================================

                bomb.radius =
                    BOMB_RADIUS;

                bomb.damage =
                    BOMB_DAMAGE;

                bomb.remaining =
                    Math.ceil(
                        BOMB_DELAY / 1000
                    );

                bomb.exploded =
                    false;

                bomb.explosionType =
                    "circle";


                // ============================================
                // ADD BOMB
                // ============================================

                this.state.bombs.set(
                    bombId,
                    bomb
                );


                console.log("");
                console.log(
                    "================================================"
                );
                console.log(
                    "[BOMB] 💣 PLANTED"
                );
                console.log(
                    `       id: ${bomb.id}`
                );
                console.log(
                    `       owner: ${player.name}`
                );
                console.log(
                    `       position: ${bomb.x}, ${bomb.y}, ${bomb.z}`
                );
                console.log(
                    `       radius: ${bomb.radius}`
                );
                console.log(
                    `       damage: ${bomb.damage}`
                );
                console.log(
                    `       remaining: ${bomb.remaining}`
                );
                console.log(
                    "================================================"
                );


                // ============================================
                // BROADCAST PLANTED
                // ============================================

                this.broadcast(
                    "bombPlanted",
                    {
                        id:
                            bomb.id,

                        ownerId:
                            bomb.ownerId,

                        x:
                            bomb.x,

                        y:
                            bomb.y,

                        z:
                            bomb.z,

                        radius:
                            bomb.radius,

                        remaining:
                            bomb.remaining,
                    }
                );


                console.log(
                    "[BOMB] bombPlanted broadcasted"
                );


                // ============================================
                // COUNTDOWN
                // ============================================

                let remaining =
                    Math.ceil(
                        BOMB_DELAY / 1000
                    );


                console.log(
                    `[BOMB] Countdown started: ${remaining}s`
                );


                const countdown =
                    this.clock.setInterval(
                        () => {

                            remaining--;


                            console.log(
                                `[BOMB] ${bombId} → ${remaining}s`
                            );


                            // =================================
                            // GET CURRENT BOMB
                            // =================================

                            const currentBomb =
                                this.state.bombs.get(
                                    bombId
                                );


                            if (!currentBomb) {

                                console.log(
                                    `[BOMB] ❌ Bomb no longer exists: ${bombId}`
                                );

                                countdown.clear();

                                return;
                            }


                            // =================================
                            // UPDATE REMAINING
                            // =================================

                            currentBomb.remaining =
                                Math.max(
                                    0,
                                    remaining
                                );


                            // =================================
                            // EXPLODE
                            // =================================

                            if (
                                remaining <= 0
                            ) {

                                console.log(
                                    `[BOMB] 💥 Calling explodeBomb(${bombId})`
                                );


                                countdown.clear();


                                this.explodeBomb(
                                    bombId
                                );

                            }

                        },
                        1000
                    );

            }
        );


        // ====================================================
        // READY
        // ====================================================

        console.log(
            "[ROOM] Bomb system ready"
        );

    }


    // ========================================================
    // RANDOM SPAWN
    // ========================================================

    private getRandomSpawnPosition() {

        /*
         * Các vị trí spawn hợp lệ trên map.
         *
         * Bạn có thể thay đổi tọa độ
         * theo map thực tế.
         */

        const spawnPoints = [

            {
                x: -9,
                y: 0,
                z: -9,
            },

            {
                x: 0,
                y: 0,
                z: -9,
            },

            {
                x: 9,
                y: 0,
                z: -9,
            },

            {
                x: -9,
                y: 0,
                z: 0,
            },

            {
                x: 9,
                y: 0,
                z: 0,
            },

            {
                x: -9,
                y: 0,
                z: 9,
            },

            {
                x: 0,
                y: 0,
                z: 9,
            },

            {
                x: 9,
                y: 0,
                z: 9,
            },

        ];


        const index =
            Math.floor(
                Math.random() *
                spawnPoints.length
            );


        return spawnPoints[index];

    }


    // ========================================================
    // RESPAWN PLAYER
    // ========================================================

    private respawnPlayer(
        sessionId: string
    ) {

        // ====================================================
        // GET PLAYER
        // ====================================================

        const player =
            this.state.players.get(
                sessionId
            );


        if (!player) {

            console.log(
                `[RESPAWN] ❌ Player not found: ${sessionId}`
            );

            return;
        }


        // ====================================================
        // GAME OVER
        // ====================================================

        if (
            this.state.gameOver
        ) {

            console.log(
                `[RESPAWN] ❌ Game already over: ${sessionId}`
            );

            return;
        }


        // ====================================================
        // RANDOM SPAWN
        // ====================================================

        const spawn =
            this.getRandomSpawnPosition();


        // ====================================================
        // POSITION
        // ====================================================

        player.x =
            spawn.x;

        player.y =
            spawn.y;

        player.z =
            spawn.z;

        player.rotation =
            0;


        // ====================================================
        // RESET HP
        // ====================================================

        player.hp =
            MAX_HP;

        player.alive =
            true;


        // ====================================================
        // BROADCAST
        // ====================================================

        this.broadcast(
            "playerRespawned",
            {
                playerId:
                    sessionId,

                x:
                    player.x,

                y:
                    player.y,

                z:
                    player.z,

                rotation:
                    player.rotation,

                hp:
                    player.hp,

                alive:
                    player.alive,
            }
        );


        // ====================================================
        // LOG
        // ====================================================

        console.log("");
        console.log(
            "================================================"
        );
        console.log(
            "[RESPAWN] 🔄 PLAYER RESPAWNED"
        );
        console.log(
            `          player: ${player.name}`
        );
        console.log(
            `          sessionId: ${sessionId}`
        );
        console.log(
            `          position: ${player.x}, ${player.y}, ${player.z}`
        );
        console.log(
            `          HP: ${player.hp}`
        );
        console.log(
            "================================================"
        );

    }


    // ========================================================
    // EXPLODE BOMB
    // ========================================================

    private explodeBomb(
        bombId: string
    ) {

        console.log("");
        console.log(
            "================================================"
        );
        console.log(
            `[BOMB] explodeBomb() CALLED`
        );
        console.log(
            `       bombId: ${bombId}`
        );
        console.log(
            "================================================"
        );


        // ====================================================
        // GET BOMB
        // ====================================================

        const bomb =
            this.state.bombs.get(
                bombId
            );


        if (!bomb) {

            console.log(
                `[BOMB] ❌ Not found: ${bombId}`
            );

            return;
        }


        if (bomb.exploded) {

            console.log(
                `[BOMB] ⚠️ Already exploded: ${bombId}`
            );

            return;
        }


        // ====================================================
        // MARK EXPLODED
        // ====================================================

        bomb.exploded =
            true;

        bomb.remaining =
            0;


        console.log("");
        console.log(
            "================================================"
        );
        console.log(
            "[BOMB] 💥 EXPLODED"
        );
        console.log(
            `       id: ${bomb.id}`
        );
        console.log(
            `       position: ${bomb.x}, ${bomb.y}, ${bomb.z}`
        );
        console.log(
            `       radius: ${bomb.radius}`
        );
        console.log(
            `       damage: ${bomb.damage}`
        );
        console.log(
            "================================================"
        );


        // ====================================================
        // CHECK PLAYERS
        // ====================================================

        console.log(
            `[BOMB] Checking ${this.state.players.size} players`
        );


        this.state.players.forEach(
            (
                player,
                sessionId
            ) => {

                console.log("");
                console.log(
                    `[BOMB] 🔎 Checking player: ${player.name}`
                );

                console.log(
                    `       sessionId: ${sessionId}`
                );

                console.log(
                    `       position: ${player.x}, ${player.y}, ${player.z}`
                );

                console.log(
                    `       HP: ${player.hp}`
                );

                console.log(
                    `       alive: ${player.alive}`
                );


                // ==========================================
                // DEAD
                // ==========================================

                if (!player.alive) {

                    console.log(
                        `       ☠️ ALREADY DEAD`
                    );

                    return;
                }


                // ==========================================
                // DISTANCE
                // ==========================================

                const distance =
                    distanceXZ(
                        bomb.x,
                        bomb.z,
                        player.x,
                        player.z
                    );


                console.log(
                    `       📏 distance: ${distance.toFixed(3)}`
                );

                console.log(
                    `       💣 radius: ${bomb.radius}`
                );


                // ==========================================
                // OUTSIDE
                // ==========================================

                if (
                    distance >
                    bomb.radius
                ) {

                    console.log(
                        `       ❌ OUTSIDE EXPLOSION`
                    );

                    return;
                }


                // ==========================================
                // INSIDE
                // ==========================================

                console.log(
                    `       💥 INSIDE EXPLOSION`
                );


                // ==========================================
                // OLD HP
                // ==========================================

                const oldHp =
                    Number(
                        player.hp ??
                        MAX_HP
                    );


                // ==========================================
                // DAMAGE
                // ==========================================

                const damage =
                    Math.min(
                        oldHp,
                        BOMB_DAMAGE
                    );


                // ==========================================
                // NEW HP
                // ==========================================

                const newHp =
                    Math.max(
                        0,
                        oldHp - damage
                    );


                // ==========================================
                // UPDATE SERVER STATE
                // ==========================================

                player.hp =
                    newHp;


                // ==========================================
                // DEATH
                // ==========================================

                if (
                    player.hp <= 0
                ) {

                    player.hp =
                        0;

                    player.alive =
                        false;


                    console.log(
                        `[BOMB] ☠️ ${player.name} DIED`
                    );


                    // ========================================
                    // RESPAWN AFTER 3 SECONDS
                    // ========================================

                    this.clock.setTimeout(
                        () => {

                            this.respawnPlayer(
                                sessionId
                            );

                        },
                        RESPAWN_DELAY
                    );

                }


                // ==========================================
                // RESULT
                // ==========================================

                console.log(
                    `       ❤️ HP: ${oldHp} → ${player.hp}`
                );

                console.log(
                    `       alive: ${player.alive}`
                );


                // ==========================================
                // DAMAGE EVENT
                // ==========================================

                this.broadcast(
                    "playerDamaged",
                    {
                        playerId:
                            sessionId,

                        damage:
                            damage,

                        hp:
                            player.hp,

                        alive:
                            player.alive,

                        distance:
                            distance,

                        bombId:
                            bomb.id,
                    }
                );


                console.log(
                    `[BOMB] playerDamaged broadcasted → ${player.name}`
                );

            }
        );


        // ====================================================
        // EXPLOSION EVENT
        // ====================================================

        this.broadcast(
            "bombExploded",
            {
                id:
                    bomb.id,

                ownerId:
                    bomb.ownerId,

                x:
                    bomb.x,

                y:
                    bomb.y,

                z:
                    bomb.z,

                radius:
                    bomb.radius,

                damage:
                    bomb.damage,
            }
        );


        console.log(
            "[BOMB] bombExploded broadcasted"
        );


        // ====================================================
        // REMOVE BOMB
        // ====================================================

        this.clock.setTimeout(
            () => {

                if (
                    this.state.bombs.has(
                        bombId
                    )
                ) {

                    this.state.bombs.delete(
                        bombId
                    );

                }


                console.log(
                    `[BOMB] Removed: ${bombId}`
                );

            },
            500
        );

    }


    // ========================================================
    // JOIN
    // ========================================================

    onJoin(
        client: Client,
        options: BattleRoomOptions
    ) {

        console.log("");
        console.log(
            "================================================"
        );
        console.log(
            "[ROOM] Player joined"
        );
        console.log(
            `       sessionId: ${client.sessionId}`
        );
        console.log(
            "================================================"
        );


        // ====================================================
        // DETERMINE HOST
        // ====================================================

        if (
            this.hostSessionId === null ||
            !this.state.players.has(
                this.hostSessionId
            )
        ) {

            this.hostSessionId =
                client.sessionId;

        }


        const isHost =
            this.hostSessionId ===
            client.sessionId;


        console.log(
            `[ROOM] Role: ${
                isHost
                    ? "HOST"
                    : "GUEST"
            }`
        );


        // ====================================================
        // CREATE NEW PLAYER
        // ====================================================

        const player =
            new PlayerState();


        player.id =
            client.sessionId;


        player.name =
            options?.name ||
            `Player ${
                this.state.players.size + 1
            }`;


        // ====================================================
        // SPAWN
        // ====================================================

        const playerIndex =
            this.state.players.size;


        player.x =
            playerIndex * 3;

        player.y =
            0;

        player.z =
            0;

        player.rotation =
            0;


        // ====================================================
        // STATS
        // ====================================================

        player.hp =
            MAX_HP;

        player.alive =
            true;


        // ====================================================
        // ADD
        // ====================================================

        this.state.players.set(
            client.sessionId,
            player
        );


        // ====================================================
        // HOST INFO
        // ====================================================

        this.broadcast(
            "hostChanged",
            {
                hostSessionId:
                    this.hostSessionId,
            }
        );


        // ====================================================
        // LOG
        // ====================================================

        console.log(
            `[ROOM] Player ${player.name} spawned`
        );

        console.log(
            `       id: ${player.id}`
        );

        console.log(
            `       role: ${
                isHost
                    ? "HOST"
                    : "GUEST"
            }`
        );

        console.log(
            `       position: ${player.x}, ${player.y}, ${player.z}`
        );

        console.log(
            `       HP: ${player.hp}`
        );

        console.log(
            `       alive: ${player.alive}`
        );

        console.log(
            `[ROOM] Host: ${this.hostSessionId}`
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

        console.log("");
        console.log(
            "================================================"
        );
        console.log(
            "[ROOM] Player left"
        );
        console.log(
            `       sessionId: ${client.sessionId}`
        );
        console.log(
            `       code: ${code ?? "unknown"}`
        );
        console.log(
            "================================================"
        );


        // ====================================================
        // WAS HOST?
        // ====================================================

        const wasHost =
            this.hostSessionId ===
            client.sessionId;


        // ====================================================
        // REMOVE PLAYER
        // ====================================================

        this.state.players.delete(
            client.sessionId
        );


        console.log(
            `[ROOM] Removed player: ${client.sessionId}`
        );


        // ====================================================
        // HOST LEAVE
        // ====================================================

        if (wasHost) {

            console.log(
                "[ROOM] HOST left"
            );


            const remainingPlayers =
                Array.from(
                    this.state.players.keys()
                );


            if (
                remainingPlayers.length > 0
            ) {

                this.hostSessionId =
                    remainingPlayers[0];


                console.log(
                    `[ROOM] New HOST: ${this.hostSessionId}`
                );

            }
            else {

                this.hostSessionId =
                    null;


                console.log(
                    "[ROOM] No players remaining"
                );

            }

        }


        // ====================================================
        // BROADCAST HOST
        // ====================================================

        this.broadcast(
            "hostChanged",
            {
                hostSessionId:
                    this.hostSessionId,
            }
        );


        // ====================================================
        // LOG
        // ====================================================

        console.log(
            `[ROOM] Host: ${
                this.hostSessionId ??
                "none"
            }`
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
