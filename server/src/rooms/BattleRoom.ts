
import {
    Client,
    Room,
    type RoomOptions,
} from "colyseus";

import {
    HospitalCollision,
} from "../../../shared/maps/hospital-collision.js";

import {
    BattleState,
    PlayerState,
} from "../schema/BattleState.js";

import {
    ZombieSystem,
} from "../systems/ZombieSystem.js";

import {
    WeaponPickupSystem,
} from "../systems/WeaponPickupSystem.js";

import {
    SpawnSystem,
} from "../systems/SpawnSystem.js";

import {
    PlayerPhysicsSystem,
} from "../systems/PlayerPhysicsSystem.js";

import {
    MovementSystem,
} from "../systems/MovementSystem.js";

import {
    CombatSystem,
} from "../systems/CombatSystem.js";

import {
    BombSystem,
} from "../systems/BombSystem.js";

import {
    isMapId,
    type MapId,
} from "../maps/map.config.js";

const MATCH_DURATION = 300;

interface BattleRoomOptions extends RoomOptions {
    mapId?: string;
    roomCode?: string;
    name?: string;
}

function generateRoomCode(): string {
    return String(
        Math.floor(100000 + Math.random() * 900000),
    );
}

export class BattleRoom extends Room<BattleRoomOptions> {
    maxClients = 10;

    state = new BattleState();

    private hostSessionId: string | null = null;
    private hospitalCollision: HospitalCollision | null = null;
    private verticalVelocity = new Map<string, number>();

    private mapId: MapId = "hospital";

    private zombieSystem: ZombieSystem | null = null;
    private weaponPickupSystem: WeaponPickupSystem | null = null;
    private spawnSystem: SpawnSystem | null = null;
    private physicsSystem: PlayerPhysicsSystem | null = null;
    private movementSystem: MovementSystem | null = null;
    private combatSystem: CombatSystem | null = null;
    private bombSystem: BombSystem | null = null;

    private matchTimer: { clear(): void } | null = null;

    async onCreate(options: BattleRoomOptions): Promise<void> {
        console.log("[BattleRoom] Creating room...");

        this.mapId = isMapId(options.mapId)
            ? options.mapId
            : "hospital";

        this.state.gameOver = false;
        this.state.roomStatus = "waiting";
        this.state.hostId = "";
        this.state.timeRemaining = MATCH_DURATION;

        // Tải collision một lần cho room.
        this.hospitalCollision = await HospitalCollision.load();

        const collision = this.hospitalCollision;

        console.log("[BattleRoom] Map:", this.mapId);

        this.spawnSystem = new SpawnSystem({
            state: this.state,
            collision,
            verticalVelocity: this.verticalVelocity,
            broadcast: (type, message) => {
                this.broadcast(type, message);
            },
        });

        this.physicsSystem = new PlayerPhysicsSystem({
            state: this.state,
            collision,
            verticalVelocity: this.verticalVelocity,
        });

        this.clock.setInterval(() => {
            if (this.state.roomStatus !== "playing") return;
            if (this.state.gameOver) return;

            this.physicsSystem?.update(
                0.05,
                this.state.gameOver,
            );
        }, 50);

        this.movementSystem = new MovementSystem({
            state: this.state,
            collision,
        });

        this.combatSystem = new CombatSystem({
            state: this.state,
            collision,
            broadcast: (type, message) => {
                this.broadcast(type, message);
            },
            respawnPlayer: (sessionId) => {
                this.spawnSystem?.respawnPlayer(sessionId);
            },
            setTimeout: (callback, ms) => {
                return this.clock.setTimeout(callback, ms);
            },
        });

        this.bombSystem = new BombSystem({
            state: this.state,
            broadcast: (type, message) => {
                this.broadcast(type, message);
            },
            setInterval: (callback, ms) => {
                const timer = this.clock.setInterval(callback, ms);

                return {
                    clear: () => timer.clear(),
                };
            },
            setTimeout: (callback, ms) => {
                return this.clock.setTimeout(callback, ms);
            },
            respawnPlayer: (sessionId) => {
                this.spawnSystem?.respawnPlayer(sessionId);
            },
        });

        this.weaponPickupSystem = new WeaponPickupSystem({
            state: this.state,
            collision,
            broadcast: (type, message) => {
                this.broadcast(type, message);
            },
        });

        console.log("[DEBUG WEAPON] Room created", {
            roomId: this.roomId,
            mapId: this.mapId,
            pickupCount: this.state.weaponPickups.size,
        });

        this.zombieSystem = new ZombieSystem({
            state: this.state,
            hospitalCollision: collision,
            respawnPlayer: (sessionId: string) => {
                this.spawnSystem?.respawnPlayer(sessionId);
            },
            broadcast: (type: string, message: unknown) => {
                this.broadcast(type, message);
            },
            setTimeout: (callback: () => void, ms: number) => {
                return this.clock.setTimeout(callback, ms);
            },
        });

        this.clock.setInterval(() => {
            if (this.state.roomStatus !== "playing") return;
            if (this.state.gameOver) return;

            this.zombieSystem?.update(this.state.gameOver);
        }, 100);

        const roomCode =
            typeof options.roomCode === "string" &&
            /^\d{6}$/.test(options.roomCode)
                ? options.roomCode
                : generateRoomCode();

        this.state.roomCode = roomCode;

await this.setMetadata({
    roomCode,
    mapId: this.mapId,
    roomStatus: "waiting",
});

        this.registerMessages();

        this.matchTimer = this.clock.setInterval(() => {
            if (this.state.roomStatus !== "playing") return;

            if (this.state.gameOver) {
                this.matchTimer?.clear();
                this.matchTimer = null;
                return;
            }

            this.state.timeRemaining = Math.max(
                0,
                this.state.timeRemaining - 1,
            );

            if (this.state.timeRemaining <= 0) {
                this.state.gameOver = true;
                this.state.roomStatus = "finished";

                this.broadcast("gameOver", {
                    reason: "time",
                });

                this.matchTimer?.clear();
                this.matchTimer = null;
            }
        }, 1000);

        console.log(
            "[BattleRoom] Ready:",
            roomCode,
            "map:",
            this.mapId,
        );
    }

    private registerMessages(): void {
        // ================================================
        // START GAME
        // Cho phép chơi solo: chỉ cần ít nhất 1 người.
        // ================================================
this.onMessage("startGame", async (client) => {
            if (!this.state.players.has(client.sessionId)) {
                client.send("startGameError", {
                    message: "Bạn không còn ở trong phòng.",
                });
                return;
            }

            if (client.sessionId !== this.hostSessionId) {
                client.send("startGameError", {
                    message: "Chỉ chủ phòng mới được bắt đầu trận đấu.",
                });
                return;
            }

            if (this.state.roomStatus !== "waiting") {
                client.send("startGameError", {
                    message: "Phòng không ở trạng thái chờ.",
                });
                return;
            }

            if (this.state.players.size < 1) {
                client.send("startGameError", {
                    message: "Không có người chơi trong phòng.",
                });
                return;
            }

            this.state.gameOver = false;
            this.state.timeRemaining = MATCH_DURATION;

            // Khởi tạo hệ thống chơi khi trận bắt đầu.
            this.weaponPickupSystem?.initialize();
            this.zombieSystem?.initialize();

            // Cập nhật trạng thái sau khi khởi tạo.
        // Chuyển phòng từ sảnh chờ sang trạng thái đang chơi.
this.state.roomStatus = "playing";

await this.setMetadata({
    roomCode: this.state.roomCode,
    mapId: this.mapId,
    roomStatus: "playing",
});

this.broadcast("gameStarted", {
    roomCode: this.state.roomCode,
    mapId: this.mapId,
    timeRemaining: this.state.timeRemaining,
});

            console.log("[BattleRoom] Game started:", {
                roomId: this.roomId,
                hostId: this.hostSessionId,
                players: this.state.players.size,
            });
        });

        this.onMessage("aiming", (client, message) => {
            const player = this.state.players.get(client.sessionId);

            if (
                !player ||
                !player.alive ||
                this.state.gameOver ||
                this.state.roomStatus !== "playing"
            ) {
                return;
            }

            player.aiming = message?.aiming === true;
        });

        this.onMessage("crouch", (client, message) => {
            const player = this.state.players.get(client.sessionId);

            if (
                !player ||
                !player.alive ||
                this.state.gameOver ||
                this.state.roomStatus !== "playing"
            ) {
                return;
            }

            player.crouching = message?.crouching === true;
        });

        this.onMessage("jump", (client) => {
            const player = this.state.players.get(client.sessionId);

            if (
                !player ||
                !player.alive ||
                this.state.gameOver ||
                this.state.roomStatus !== "playing"
            ) {
                return;
            }

            player.jumpTrigger += 1;
        });

        this.onMessage("pickupWeapon", (client) => {
            if (this.state.roomStatus !== "playing") return;

            this.weaponPickupSystem?.handlePickup(
                client.sessionId,
            );
        });

        // ================================================
        // SWITCH WEAPON
        // Slot 0 = tay không/mặc định
        // Slot 1 = weapon1
        // Slot 2 = weapon2
        // ================================================
        this.onMessage("switchWeapon", (client, message) => {
            if (
                this.state.roomStatus !== "playing" ||
                this.state.gameOver
            ) {
                return;
            }

            const player = this.state.players.get(client.sessionId);

            if (!player || !player.alive) return;

            const slot = Number(message?.slot);

            if (![0, 1, 2].includes(slot)) return;

            if (slot === 1 && !player.weapon1) return;
            if (slot === 2 && !player.weapon2) return;

            player.equippedSlot = slot;
        });

        this.onMessage("attack", (client, message) => {
            if (this.state.roomStatus !== "playing") return;

            const player = this.state.players.get(client.sessionId);

            if (!player || !player.alive || this.state.gameOver) {
                return;
            }

            this.combatSystem?.handleAttack(
                client.sessionId,
                message,
            );
        });

        this.onMessage("move", (client, message) => {
            if (this.state.roomStatus !== "playing") return;

            this.movementSystem?.handleMove(
                client.sessionId,
                message,
                this.state.gameOver,
            );
        });

        this.onMessage("plantBomb", (client) => {
            if (this.state.roomStatus !== "playing") return;

            this.bombSystem?.plantBomb(client.sessionId);
        });
    }

    onJoin(client: Client, options: BattleRoomOptions): void {
        if (this.state.roomStatus !== "waiting") {
            throw new Error(
                "Trận đấu đã bắt đầu, không thể tham gia.",
            );
        }
if (
    options.roomCode &&
    options.roomCode !== this.state.roomCode
) {
    throw new Error("Mã phòng không chính xác.");
}
        console.log("[BattleRoom] Join:", client.sessionId);

        // Người đầu tiên vào phòng là chủ phòng.
// Xác định chủ phòng từ sessionId được lưu khi tạo phòng.
// Nếu chưa có chủ phòng thì người đầu tiên vào sẽ là chủ.
if (!this.hostSessionId) {
    this.hostSessionId = client.sessionId;
}

this.state.hostId = this.hostSessionId;

        const player = new PlayerState();

        player.id = client.sessionId;

        player.name =
            typeof options?.name === "string" && options.name.trim()
                ? options.name.trim().slice(0, 24)
                : `Player ${this.state.players.size + 1}`;

        player.weapon1 = "";
        player.weapon2 = "";
        player.equippedSlot = 0;
        player.ammo = 0;

        player.hp = 100;
        player.alive = true;
        player.moving = false;
        player.rotation = 0;

        if (!this.spawnSystem) {
            throw new Error(
                "[BattleRoom] SpawnSystem chưa được khởi tạo.",
            );
        }

        this.spawnSystem.initializePlayer(
            player,
            client.sessionId,
        );

        this.state.players.set(client.sessionId, player);

        // Đồng bộ host sau khi thêm người chơi vào state.
        this.state.hostId = this.hostSessionId ?? "";

        this.broadcast("hostChanged", {
            hostId: this.state.hostId,
        });

        console.log("[BattleRoom] Player joined:", {
            name: player.name,
            sessionId: client.sessionId,
            hostId: this.state.hostId,
            playerCount: this.state.players.size,
        });
    }

    onLeave(client: Client): void {
        const sessionId = client.sessionId;

        console.log("[BattleRoom] Leave:", sessionId);

        this.state.players.delete(sessionId);

        this.spawnSystem?.removePlayer(sessionId);
        this.physicsSystem?.removePlayer(sessionId);
        this.combatSystem?.removePlayer(sessionId);
        this.weaponPickupSystem?.removePlayer(sessionId);

        if (this.hostSessionId === sessionId) {
            const nextHost = this.state.players.keys().next();

            this.hostSessionId =
                nextHost.done ? null : nextHost.value;
        }

        // Luôn cập nhật state sau khi xác định host mới.
        this.state.hostId = this.hostSessionId ?? "";

        this.broadcast("hostChanged", {
            hostId: this.state.hostId,
        });

        console.log("[BattleRoom] Player left:", {
            sessionId,
            hostId: this.state.hostId,
            remainingPlayers: this.state.players.size,
        });
    }

    onDispose(): void {
        this.matchTimer?.clear();
        this.matchTimer = null;

        console.log("[BattleRoom] Disposed:", this.roomId);
    }
}
