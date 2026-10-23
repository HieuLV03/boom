
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
        this.state.timeRemaining = MATCH_DURATION;

        // Load collision exactly once.
        this.hospitalCollision = await HospitalCollision.load();

        const collision = this.hospitalCollision;

        console.log("[BattleRoom] Map:", this.mapId);

        // Spawn and respawn.
        this.spawnSystem = new SpawnSystem({
            state: this.state,
            collision,
            verticalVelocity: this.verticalVelocity,
            broadcast: (type, message) => {
                this.broadcast(type, message);
            },
        });

        // Player physics.
        this.physicsSystem = new PlayerPhysicsSystem({
            state: this.state,
            collision,
            verticalVelocity: this.verticalVelocity,
        });

        this.clock.setInterval(() => {
            this.physicsSystem?.update(
                0.05,
                this.state.gameOver,
            );
        }, 50);

        // Movement and collision.
        this.movementSystem = new MovementSystem({
            state: this.state,
            collision,
        });

        // Combat.
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

        // Bombs.
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

        // Weapon pickups.
        this.weaponPickupSystem = new WeaponPickupSystem({
            state: this.state,
            collision,
            broadcast: (type, message) => {
                this.broadcast(type, message);
            },
        });

this.weaponPickupSystem.initialize();

console.log("[DEBUG WEAPON] Sau initialize", {
    roomId: this.roomId,
    mapId: this.mapId,
    pickupCount: this.state.weaponPickups.size,
    pickups: Array.from(
        this.state.weaponPickups.values(),
    ).map((pickup) => ({
        id: pickup.id,
        weaponType: pickup.weaponType,
        x: pickup.x,
        y: pickup.y,
        z: pickup.z,
        available: pickup.available,
    })),
});
        // Zombies.
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

        this.zombieSystem.initialize();

        this.clock.setInterval(() => {
            this.zombieSystem?.update(this.state.gameOver);
        }, 100);

        // Room code.
        const roomCode =
            typeof options.roomCode === "string" &&
            /^\d{6}$/.test(options.roomCode)
                ? options.roomCode
                : generateRoomCode();

        this.state.roomCode = roomCode;

        await this.setMetadata({
            roomCode,
            mapId: this.mapId,
        });

        // Register client messages.
        this.registerMessages();

        // Match countdown.
        this.matchTimer = this.clock.setInterval(() => {
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

        this.onMessage("aiming", (client, message) => {
        const player = this.state.players.get(client.sessionId);

        if (!player || !player.alive || this.state.gameOver) {
            return;
        }

        player.aiming = message?.aiming === true;
    });

    this.onMessage("crouch", (client, message) => {
    const player = this.state.players.get(client.sessionId);
    if (!player || !player.alive || this.state.gameOver) return;

    player.crouching = message?.crouching === true;
});

this.onMessage("jump", (client) => {
    const player = this.state.players.get(client.sessionId);
    if (!player || !player.alive || this.state.gameOver) return;

    player.jumpTrigger += 1;
});

        this.onMessage("pickupWeapon", (client) => {
            this.weaponPickupSystem?.handlePickup(
                client.sessionId,
            );
        });

        this.onMessage("switchWeapon", (client, message) => {
            if (this.state.gameOver) return;

            const player = this.state.players.get(client.sessionId);

            if (!player || !player.alive) return;

            const slot = Number(message?.slot);

            if (![0, 1, 2].includes(slot)) return;

            if (slot === 1 && !player.weapon2) return;
            if (slot === 0 && !player.weapon1) return;

            player.equippedSlot = slot;
        });

        this.onMessage("attack", (client, message) => {
            this.combatSystem?.handleAttack(
                client.sessionId,
                message,
            );
        });

        this.onMessage("move", (client, message) => {
            this.movementSystem?.handleMove(
                client.sessionId,
                message,
                this.state.gameOver,
            );
        });

        this.onMessage("plantBomb", (client) => {
            this.bombSystem?.plantBomb(client.sessionId);
        });
    }

    onJoin(client: Client, options: BattleRoomOptions): void {
        console.log("[BattleRoom] Join:", client.sessionId);

        if (!this.hostSessionId) {
            this.hostSessionId = client.sessionId;
        }

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

        this.broadcast("hostChanged", {
            hostId: this.hostSessionId,
        });

        console.log("[BattleRoom] Player joined:", player.name);
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

        this.broadcast("hostChanged", {
            hostId: this.hostSessionId,
        });
    }

    onDispose(): void {
        this.matchTimer?.clear();
        this.matchTimer = null;

        console.log("[BattleRoom] Disposed:", this.roomId);
    }
}
