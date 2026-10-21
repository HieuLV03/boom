
import {
    BattleState,
    PlayerState,
} from "../schema/BattleState.js";

import type {
    HospitalCollision,
} from "../../../shared/maps/hospital-collision.js";

// ============================================================
// TYPES
// ============================================================

interface Vec3 {
    x: number;
    y: number;
    z: number;
}

interface AttackMessage {
    action?: string;
    origin?: Vec3;
    direction?: Vec3;
}

interface CombatSystemOptions {
    state: BattleState;
    collision: HospitalCollision;
    broadcast: (type: string, message: unknown) => void;
    respawnPlayer: (sessionId: string) => void;
    setTimeout: (callback: () => void, ms: number) => unknown;
}

type TargetType = "player" | "zombie" | "scareObject";

interface RayHit {
    type: TargetType;
    id: string;
    distance: number;
}

// ============================================================
// COMBAT SYSTEM
// ============================================================

export class CombatSystem {
    private readonly state: BattleState;
    private readonly collision: HospitalCollision;

    private readonly broadcast: (
        type: string,
        message: unknown,
    ) => void;

    private readonly respawnPlayer: (
        sessionId: string,
    ) => void;

    private readonly scheduleTimeout: (
        callback: () => void,
        ms: number,
    ) => unknown;

    private readonly lastAttackAt = new Map<string, number>();

    private readonly maxHp = 100;
    private readonly respawnDelay = 3000;

    private readonly punchRange = 1.8;
    private readonly punchDamage = 10;
    private readonly punchCooldown = 500;

    private readonly rifleRange = 51;
    private readonly rifleDamage = 25;
    private readonly rifleCooldown = 250;

    private readonly scareObjectMaxHp = 100;
    private scareObjectHp = 100;
    private scareObjectDestroyed = false;

    private readonly scareObjectPosition: Vec3 = {
        x: 0,
        y: 1.2,
        z: 0,
    };

    private readonly scareObjectRadius = 1.05;

    constructor(options: CombatSystemOptions) {
        this.state = options.state;
        this.collision = options.collision;
        this.broadcast = options.broadcast;
        this.respawnPlayer = options.respawnPlayer;
        this.scheduleTimeout = options.setTimeout;
    }

    // ========================================================
    // HANDLE ATTACK
    // ========================================================

    handleAttack(
        sessionId: string,
        message: AttackMessage,
    ): void {
        if (this.state.gameOver) return;

        const attacker = this.state.players.get(sessionId);

        if (!attacker || !attacker.alive) return;

        const slot = attacker.equippedSlot;

        const weapon =
            slot === 1
                ? attacker.weapon2
                : slot === 0
                    ? attacker.weapon1
                    : "";

        const isRifle = weapon === "rifle";
        const expectedAction = isRifle ? "shoot" : "punch";

        if (message?.action !== expectedAction) return;

        const now = Date.now();

        const cooldown = isRifle
            ? this.rifleCooldown
            : this.punchCooldown;

        const previousAttack =
            this.lastAttackAt.get(sessionId) ?? 0;

        if (now - previousAttack < cooldown) return;

        this.lastAttackAt.set(sessionId, now);

        if (isRifle) {
            this.handleRifleAttack(
                sessionId,
                attacker,
                message,
            );
        } else {
            this.handlePunchAttack(
                sessionId,
                attacker,
            );
        }
    }

    // ========================================================
    // RIFLE ATTACK
    // ========================================================

    private handleRifleAttack(
        sessionId: string,
        attacker: PlayerState,
        message: AttackMessage,
    ): void {
        const origin = message.origin;
        const direction = message.direction;

        if (
            !this.isValidVec3(origin) ||
            !this.isValidVec3(direction)
        ) {
            return;
        }

        const directionLength = Math.hypot(
            direction.x,
            direction.y,
            direction.z,
        );

        if (directionLength < 0.0001) return;

        // Không cho client gửi origin ở quá xa nhân vật.
        const playerOrigin: Vec3 = {
            x: attacker.x,
            y: attacker.y + 1.1,
            z: attacker.z,
        };

        const originDistance = this.distance3D(
            origin,
            playerOrigin,
        );

        if (originDistance > 10.5) return;

        const normalizedDirection: Vec3 = {
            x: direction.x / directionLength,
            y: direction.y / directionLength,
            z: direction.z / directionLength,
        };

        const hit = this.findNearestRayHit(
            sessionId,
            origin,
            normalizedDirection,
            this.rifleRange,
        );

        this.broadcast("attackPerformed", {
            playerId: sessionId,
            action: "shoot",
            weapon: "rifle",
            origin,
            direction: normalizedDirection,
            hit: hit !== null,
            targetId: hit?.id ?? null,
            targetType: hit?.type ?? null,
        });

        if (!hit) return;

        if (hit.type === "player") {
            this.damagePlayer(
                sessionId,
                hit.id,
                this.rifleDamage,
            );
            return;
        }

        if (hit.type === "zombie") {
            this.damageZombie(
                sessionId,
                hit.id,
                this.rifleDamage,
            );
            return;
        }

        this.damageScareObject(
            sessionId,
            this.rifleDamage,
        );
    }

    // ========================================================
    // PUNCH ATTACK
    // ========================================================

    private handlePunchAttack(
        sessionId: string,
        attacker: PlayerState,
    ): void {
        const forwardX = Math.sin(attacker.rotation);
        const forwardZ = Math.cos(attacker.rotation);

        // Dùng object reference để TypeScript nhận diện
        // chính xác giá trị được cập nhật trong callback.
        const nearestRef: {
            value: RayHit | null;
        } = {
            value: null,
        };

        const checkTarget = (
            type: TargetType,
            id: string,
            x: number,
            z: number,
        ): void => {
            const dx = x - attacker.x;
            const dz = z - attacker.z;

            const distance = Math.hypot(dx, dz);

            if (
                distance > this.punchRange ||
                distance < 0.0001
            ) {
                return;
            }

            const dot =
                (dx / distance) * forwardX +
                (dz / distance) * forwardZ;

            // Chỉ đánh trúng mục tiêu phía trước.
            if (dot < 0.45) return;

            const currentNearest = nearestRef.value;

            if (
                currentNearest === null ||
                distance < currentNearest.distance
            ) {
                nearestRef.value = {
                    type,
                    id,
                    distance,
                };
            }
        };

        // Kiểm tra người chơi khác.
        this.state.players.forEach((target, targetId) => {
            if (targetId === sessionId || !target.alive) {
                return;
            }

            checkTarget(
                "player",
                targetId,
                target.x,
                target.z,
            );
        });

        // Kiểm tra zombie.
        this.state.zombies.forEach((zombie, zombieId) => {
            if (!zombie.alive) return;

            checkTarget(
                "zombie",
                zombieId,
                zombie.x,
                zombie.z,
            );
        });

        // Kiểm tra vật thể có thể phá hủy.
        if (!this.scareObjectDestroyed) {
            checkTarget(
                "scareObject",
                "scare-object",
                this.scareObjectPosition.x,
                this.scareObjectPosition.z,
            );
        }

        const nearest = nearestRef.value;

        this.broadcast("attackPerformed", {
            playerId: sessionId,
            action: "punch",
            weapon: "punch",
            hit: nearest !== null,
            targetId: nearest?.id ?? null,
            targetType: nearest?.type ?? null,
        });

        if (!nearest) return;

        if (nearest.type === "player") {
            this.damagePlayer(
                sessionId,
                nearest.id,
                this.punchDamage,
            );
        } else if (nearest.type === "zombie") {
            this.damageZombie(
                sessionId,
                nearest.id,
                this.punchDamage,
            );
        } else {
            this.damageScareObject(
                sessionId,
                this.punchDamage,
            );
        }
    }

    // ========================================================
    // RAYCAST HIT DETECTION
    // ========================================================

    private findNearestRayHit(
        attackerId: string,
        origin: Vec3,
        direction: Vec3,
        maxDistance: number,
    ): RayHit | null {
        const nearestRef: {
            value: RayHit | null;
        } = {
            value: null,
        };

        const testSphere = (
            type: TargetType,
            id: string,
            center: Vec3,
            radius: number,
        ): void => {
            const distance = this.raySphereDistance(
                origin,
                direction,
                center,
                radius,
            );

            if (
                distance === null ||
                distance > maxDistance
            ) {
                return;
            }

            const currentNearest = nearestRef.value;

            if (
                currentNearest === null ||
                distance < currentNearest.distance
            ) {
                nearestRef.value = {
                    type,
                    id,
                    distance,
                };
            }
        };

        // Người chơi: kiểm tra nhiều độ cao trên cơ thể.
        this.state.players.forEach((player, playerId) => {
            if (
                playerId === attackerId ||
                !player.alive
            ) {
                return;
            }

            for (const height of [0.45, 1.0, 1.55, 2.0]) {
                testSphere(
                    "player",
                    playerId,
                    {
                        x: player.x,
                        y: player.y + height,
                        z: player.z,
                    },
                    0.75,
                );
            }
        });

        // Zombie: kiểm tra nhiều độ cao trên cơ thể.
        this.state.zombies.forEach((zombie, zombieId) => {
            if (!zombie.alive) return;

            for (const height of [0.4, 0.9, 1.4, 1.9]) {
                testSphere(
                    "zombie",
                    zombieId,
                    {
                        x: zombie.x,
                        y: zombie.y + height,
                        z: zombie.z,
                    },
                    0.75,
                );
            }
        });

        // Vật thể có thể phá hủy.
        if (!this.scareObjectDestroyed) {
            testSphere(
                "scareObject",
                "scare-object",
                this.scareObjectPosition,
                this.scareObjectRadius,
            );
        }

        return nearestRef.value;
    }

    // ========================================================
    // RAY / SPHERE INTERSECTION
    // ========================================================

    private raySphereDistance(
        origin: Vec3,
        direction: Vec3,
        center: Vec3,
        radius: number,
    ): number | null {
        const ox = origin.x - center.x;
        const oy = origin.y - center.y;
        const oz = origin.z - center.z;

        const b =
            ox * direction.x +
            oy * direction.y +
            oz * direction.z;

        const c =
            ox * ox +
            oy * oy +
            oz * oz -
            radius * radius;

        const discriminant = b * b - c;

        if (discriminant < 0) return null;

        const sqrt = Math.sqrt(discriminant);
        const near = -b - sqrt;
        const far = -b + sqrt;

        if (near >= 0) return near;
        if (far >= 0) return far;

        return null;
    }

    // ========================================================
    // PLAYER DAMAGE
    // ========================================================

    private damagePlayer(
        attackerId: string,
        victimId: string,
        damage: number,
    ): void {
        const victim = this.state.players.get(victimId);

        if (!victim || !victim.alive) return;

        const actualDamage = Math.min(
            victim.hp,
            damage,
        );

        victim.hp = Math.max(
            0,
            victim.hp - actualDamage,
        );

        if (victim.hp <= 0) {
            victim.hp = 0;
            victim.alive = false;
            victim.moving = false;

            this.scheduleTimeout(() => {
                this.respawnPlayer(victimId);
            }, this.respawnDelay);
        }

        this.broadcast("playerDamaged", {
            attackerId,
            playerId: victimId,
            damage: actualDamage,
            hp: victim.hp,
            alive: victim.alive,
        });
    }

    // ========================================================
    // ZOMBIE DAMAGE
    // ========================================================

    private damageZombie(
        attackerId: string,
        zombieId: string,
        damage: number,
    ): void {
        const zombie = this.state.zombies.get(zombieId);

        if (!zombie || !zombie.alive) return;

        zombie.hp = Math.max(
            0,
            zombie.hp - damage,
        );

        if (zombie.hp <= 0) {
            zombie.hp = 0;
            zombie.alive = false;
        }

        this.broadcast("zombieDamaged", {
            attackerId,
            zombieId,
            damage,
            hp: zombie.hp,
            alive: zombie.alive,
        });
    }

    // ========================================================
    // DESTRUCTIBLE OBJECT DAMAGE
    // ========================================================

    private damageScareObject(
        attackerId: string,
        damage: number,
    ): void {
        if (this.scareObjectDestroyed) return;

        this.scareObjectHp = Math.max(
            0,
            this.scareObjectHp - damage,
        );

        this.broadcast("scareObjectDamaged", {
            attackerId,
            damage,
            hp: this.scareObjectHp,
            maxHp: this.scareObjectMaxHp,
        });

        if (this.scareObjectHp > 0) return;

        this.scareObjectDestroyed = true;

        this.broadcast("scareObjectDestroyed", {
            attackerId,
        });
    }

    // ========================================================
    // VALIDATION / HELPERS
    // ========================================================

    private isValidVec3(
        value: unknown,
    ): value is Vec3 {
        if (
            !value ||
            typeof value !== "object"
        ) {
            return false;
        }

        const vector = value as Record<string, unknown>;

        return (
            typeof vector.x === "number" &&
            Number.isFinite(vector.x) &&
            typeof vector.y === "number" &&
            Number.isFinite(vector.y) &&
            typeof vector.z === "number" &&
            Number.isFinite(vector.z)
        );
    }

    private distance3D(
        a: Vec3,
        b: Vec3,
    ): number {
        return Math.hypot(
            a.x - b.x,
            a.y - b.y,
            a.z - b.z,
        );
    }

    // ========================================================
    // CLEANUP
    // ========================================================

    removePlayer(sessionId: string): void {
        this.lastAttackAt.delete(sessionId);
    }
}
