
import {
    BattleState,
    PlayerState,
    ZombieState,
} from "../schema/BattleState.js";

import type { HospitalCollision } from "../../../shared/maps/hospital-collision.js";
// ============================================================
// CONFIG
// ============================================================

const ZOMBIE_COUNT = 5;
const ZOMBIE_SPEED = 1.8;
const ZOMBIE_ATTACK_RANGE = 1.5;
const ZOMBIE_DAMAGE = 10;
const ZOMBIE_ATTACK_COOLDOWN = 1200;
const ZOMBIE_UPDATE_INTERVAL = 100;
const ZOMBIE_MAX_HP = 100;
const RESPAWN_DELAY = 3000;
const ZOMBIE_COLLISION_RADIUS = 0.35;
const ZOMBIE_HEIGHT = 1.8;
const SPAWN_ATTEMPTS = 30;

// ============================================================
// TYPES
// ============================================================

type Position = {
    x: number;
    y: number;
    z: number;
};

type ZombieContext = {
    state: BattleState;
    hospitalCollision: HospitalCollision;

    respawnPlayer: (sessionId: string) => void;

    broadcast: (
        type: string,
        message: unknown,
    ) => void;

    setTimeout: (
        callback: () => void,
        ms: number,
    ) => void;
};

// ============================================================
// HELPERS
// ============================================================

function distanceXZ(
    x1: number,
    z1: number,
    x2: number,
    z2: number,
): number {
    return Math.hypot(x1 - x2, z1 - z2);
}

// ============================================================
// ZOMBIE SYSTEM - GLB COLLISION
// ============================================================

export class ZombieSystem {
    private readonly context: ZombieContext;

    private readonly zombieAttackAt =
        new Map<string, number>();

    private lastUpdateAt = 0;

    constructor(context: ZombieContext) {
        this.context = context;
    }

    // ========================================================
    // RANDOM SPAWN
    // ========================================================

    private getSpawnPosition(): Position {
        const collision = this.context.hospitalCollision;
        const spawnPoints = collision.getSpawnPoints();

        if (spawnPoints.length === 0) {
            throw new Error(
                "[ZOMBIE] Hospital GLB has no SPAWN_ markers.",
            );
        }

        // Thử tìm vị trí gần spawn marker nhưng không trùng
        // hoàn toàn với điểm spawn của người chơi.
        for (let attempt = 0; attempt < SPAWN_ATTEMPTS; attempt++) {
            const marker =
                spawnPoints[
                    Math.floor(Math.random() * spawnPoints.length)
                ];

            const angle = Math.random() * Math.PI * 2;
            const distance = 2 + Math.random() * 5;

            const position: Position = {
                x: marker.position.x + Math.cos(angle) * distance,
                y: marker.position.y,
                z: marker.position.z + Math.sin(angle) * distance,
            };

            const blocked = !collision.canMoveTo(
                position.x,
                position.z,
                ZOMBIE_COLLISION_RADIUS,
                position.y,
                ZOMBIE_HEIGHT,
            );

            if (blocked) continue;

            // Không spawn zombie chồng lên người chơi.
            let overlapsPlayer = false;

            this.context.state.players.forEach((player) => {
                if (!player.alive) return;

                if (
                    distanceXZ(
                        position.x,
                        position.z,
                        player.x,
                        player.z,
                    ) < 2
                ) {
                    overlapsPlayer = true;
                }
            });

            if (!overlapsPlayer) {
                return position;
            }
        }

        // Fallback: dùng marker trực tiếp nếu không tìm được
        // vị trí offset hợp lệ. Nên tạo thêm marker trong GLB.
        const fallback =
            spawnPoints[
                Math.floor(Math.random() * spawnPoints.length)
            ];

        return { ...fallback.position };
    }

    // ========================================================
    // INITIALIZE
    // ========================================================

    initialize(): void {
        const { state } = this.context;

        state.zombies.clear();
        this.zombieAttackAt.clear();
        this.lastUpdateAt = 0;

        for (let i = 0; i < ZOMBIE_COUNT; i++) {
            const position = this.getSpawnPosition();
            const zombie = new ZombieState();

            zombie.id = `zombie-${i + 1}`;
            zombie.x = position.x;
            zombie.y = position.y;
            zombie.z = position.z;
            zombie.rotation = 0;
            zombie.hp = ZOMBIE_MAX_HP;
            zombie.alive = true;
            zombie.moving = false;
            zombie.attacking = false;

            state.zombies.set(zombie.id, zombie);
        }

        console.log(
            `[ZOMBIE] Spawned ${state.zombies.size} GLB-based zombies.`,
        );
    }

    // ========================================================
    // UPDATE AI
    // ========================================================

    update(gameOver: boolean): void {
        const { state, hospitalCollision } = this.context;

        if (gameOver) return;

        const now = Date.now();

        if (
            this.lastUpdateAt !== 0 &&
            now - this.lastUpdateAt < ZOMBIE_UPDATE_INTERVAL
        ) {
            return;
        }

        const deltaTime =
            this.lastUpdateAt === 0
                ? ZOMBIE_UPDATE_INTERVAL / 1000
                : Math.min(
                    (now - this.lastUpdateAt) / 1000,
                    0.2,
                );

        this.lastUpdateAt = now;

        state.zombies.forEach((zombie) => {
            if (!zombie.alive || zombie.hp <= 0) {
                zombie.moving = false;
                zombie.attacking = false;
                return;
            }

            const target = this.findNearestPlayer(zombie);

            zombie.attacking = false;

            if (!target) {
                zombie.moving = false;
                return;
            }

            const dx = target.x - zombie.x;
            const dz = target.z - zombie.z;
            const distance = Math.hypot(dx, dz);

            zombie.rotation = Math.atan2(dx, dz);

            // --------------------------------------------
            // ATTACK PLAYER
            // --------------------------------------------

            if (distance <= ZOMBIE_ATTACK_RANGE) {
                zombie.moving = false;

                const lastAttack =
                    this.zombieAttackAt.get(zombie.id) ?? 0;

                if (
                    now - lastAttack < ZOMBIE_ATTACK_COOLDOWN
                ) {
                    return;
                }

                this.zombieAttackAt.set(zombie.id, now);
                console.log("[ZOMBIE ATTACK DEBUG]", {
    zombieId: zombie.id,
    playerId: target.id,
    distance,
    playerHpBefore: target.hp,
    playerAlive: target.alive,
});
                zombie.attacking = true;

                const damage = Math.min(
                    target.hp,
                    ZOMBIE_DAMAGE,
                );

                target.hp = Math.max(0, target.hp - damage);
console.log("[ZOMBIE DAMAGE RESULT]", {
    playerId: target.id,
    damage,
    playerHpAfter: target.hp,
});
                if (target.hp <= 0) {
                    target.hp = 0;
                    target.alive = false;

                    this.context.setTimeout(() => {
                        this.context.respawnPlayer(target.id);
                    }, RESPAWN_DELAY);
                }

                this.context.broadcast("playerDamaged", {
                    playerId: target.id,
                    attackerId: zombie.id,
                    damage,
                    hp: target.hp,
                    alive: target.alive,
                    distance,
                    weapon: "zombie",
                });

                this.context.broadcast("zombieBite", {
                    zombieId: zombie.id,
                    playerId: target.id,
                    damage,
                });

                return;
            }

            // --------------------------------------------
            // CHASE PLAYER
            // GLB AABB collision; direct movement, no BFS.
            // --------------------------------------------

            if (distance < 0.001) {
                zombie.moving = false;
                return;
            }

            const step = Math.min(
                ZOMBIE_SPEED * deltaTime,
                distance,
            );

            const nextX =
                zombie.x + (dx / distance) * step;

            const nextZ =
                zombie.z + (dz / distance) * step;

            let moved = false;

            // Move X separately to allow sliding along walls.
            if (
                hospitalCollision.canMoveTo(
                    nextX,
                    zombie.z,
                    ZOMBIE_COLLISION_RADIUS,
                    zombie.y,
                    ZOMBIE_HEIGHT,
                )
            ) {
                zombie.x = nextX;
                moved = true;
            }

            // Then move Z using the updated X.
            if (
                hospitalCollision.canMoveTo(
                    zombie.x,
                    nextZ,
                    ZOMBIE_COLLISION_RADIUS,
                    zombie.y,
                    ZOMBIE_HEIGHT,
                )
            ) {
                zombie.z = nextZ;
                moved = true;
            }

            zombie.moving = moved;
        });
    }

    // ========================================================
    // FIND NEAREST PLAYER
    // ========================================================

    private findNearestPlayer(
        zombie: ZombieState,
    ): PlayerState | null {
        let nearest: PlayerState | null = null;
        let nearestDistance = Infinity;

        this.context.state.players.forEach((player) => {
            if (!player.alive || player.hp <= 0) return;

            const distance = distanceXZ(
                zombie.x,
                zombie.z,
                player.x,
                player.z,
            );

            if (distance < nearestDistance) {
                nearest = player;
                nearestDistance = distance;
            }
        });

        return nearest;
    }
}
