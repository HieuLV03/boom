import {
    Client,
    Room,
    type RoomOptions,
} from "colyseus";
import { HOSPITAL_CONFIG as C } from "../../../shared/maps/hospital.config.js";
import {
    HospitalCollision,
} from "../../../shared/maps/hospital-collision.js";
import {
    BattleState,
    PlayerState,
    BombState,
    WeaponPickupState,
    ZombieState,
} from "../schema/BattleState.js";

import { ZombieSystem } from "../systems/ZombieSystem.js";

import {
    isMapId,
    type MapId,
} from "../maps/map.config.js";

// ============================================================
// TYPES
// ============================================================

interface BattleRoomOptions extends RoomOptions {

    name?: string;

    roomCode?: string;

    mapId?: MapId;

}


const MAX_HP = 100;

const MATCH_DURATION = 300;

const RESPAWN_DELAY = 3000;

const BOMB_DELAY = 3000;

const BOMB_RADIUS = 4;

const BOMB_DAMAGE = 20;

const WEAPON_PICKUP_DISTANCE = 2.8;
const PUNCH_RANGE = 1.8;
const PUNCH_DAMAGE = 10;
const RIFLE_RANGE = 51;
const RIFLE_DAMAGE = 25;
const RIFLE_COOLDOWN = 250;
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

private zombieSystem: ZombieSystem | null = null;

private mapId: MapId = "hospital";
private hospitalCollision: HospitalCollision | null = null;

private lastAttackAt = new Map<string, number>();

// ============================================================
// JUMPSCARE OBJECT
// ============================================================
private scareObjectHp = 100;
private readonly scareObjectMaxHp = 100;
private scareObjectDestroyed = false;

private readonly scareObjectPosition = {
    x: 0,
    y: 1.2,
    z: 0,
};


private readonly scareObjectRadius = 1.05;
    // ========================================================
    // CREATE
    // ========================================================

async onCreate(
    options: BattleRoomOptions
) {
    
this.mapId = isMapId(options?.mapId)
    ? options.mapId
    : "hospital";

this.hospitalCollision = await HospitalCollision.load();

const spawnPoints = this.hospitalCollision.getSpawnPoints();

if (spawnPoints.length === 0) {
    throw new Error(
        "[ROOM] Bệnh viện GLB chưa có spawn marker SPAWN_.",
    );
}

console.log(
    `[ROOM] Hospital collision ready: ${
        this.hospitalCollision.getCollisionBoxes().length
    } boxes`,
);

console.log(
    `[ROOM] Hospital spawn points: ${spawnPoints.length}`,
);

console.log(`[ROOM] Map: ${this.mapId}`);


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

this.onMessage("pickupWeapon", (client) => {
    if (this.state.gameOver) return;

    const player = this.state.players.get(client.sessionId);
    if (!player || !player.alive) return;

    let nearest: WeaponPickupState | null = null;
    let nearestDistance = Infinity;
// ========================================================
// INTERACT WITH HOSPITAL DOOR
// ========================================================


    this.state.weaponPickups.forEach((pickup) => {
        if (!pickup.available) return;

        const distance = distanceXZ(
            player.x,
            player.z,
            pickup.x,
            pickup.z,
        );

        if (distance < nearestDistance) {
            nearest = pickup;
            nearestDistance = distance;
        }
    });

    if (!nearest || nearestDistance > WEAPON_PICKUP_DISTANCE) {
        return;
    }

    const pickup = nearest as WeaponPickupState;

    // Chọn ô trống trước; nếu đã đầy thì thay vũ khí ở ô đang dùng.
    let slot: 1 | 2;

    if (!player.weapon1) {
        slot = 1;
    } else if (!player.weapon2) {
        slot = 2;
    } else {
        slot = player.equippedSlot === 2 ? 2 : 1;
    }

    if (slot === 1) {
        player.weapon1 = pickup.weaponType;
    } else {
        player.weapon2 = pickup.weaponType;
    }

    player.equippedSlot = slot;
    player.ammo = 999;

    pickup.available = false;
    this.state.weaponPickups.delete(pickup.id);

    this.broadcast("weaponPickedUp", {
        playerId: client.sessionId,
        weaponType: pickup.weaponType,
        slot,
        pickupId: pickup.id,
    });

    console.log(
        `[WEAPON] ${player.name} picked up ${pickup.weaponType} in slot ${slot}`,
    );
});

this.onMessage("switchWeapon", (client, message) => {
    if (this.state.gameOver) return;

    const player = this.state.players.get(client.sessionId);
    if (!player || !player.alive) return;

    const slot = Number(message?.slot);

    if (slot !== 0 && slot !== 1 && slot !== 2) return;

    if (slot === 1 && !player.weapon1) return;
    if (slot === 2 && !player.weapon2) return;

    player.equippedSlot = slot;
});
this.onMessage("attack", (client, message) => {
    if (this.state.gameOver) return;

    const attacker = this.state.players.get(client.sessionId);
    if (!attacker || !attacker.alive) return;

    const now = Date.now();
    const currentWeapon =
        attacker.equippedSlot === 1
            ? attacker.weapon1
            : attacker.equippedSlot === 2
                ? attacker.weapon2
                : "";

    const isRifle = currentWeapon === "rifle";
    const action = isRifle ? "shoot" : "punch";

    // Không cho client giả mạo kiểu tấn công.
    if (message?.action !== action) return;

    const cooldown = isRifle ? RIFLE_COOLDOWN : 500;
    const lastAttack = this.lastAttackAt.get(client.sessionId) ?? 0;

    if (now - lastAttack < cooldown) return;
    this.lastAttackAt.set(client.sessionId, now);

   
const range = isRifle ? RIFLE_RANGE : PUNCH_RANGE;
const damage = isRifle ? RIFLE_DAMAGE : PUNCH_DAMAGE;

let target: PlayerState | null = null;
let bestDistance = Infinity;
let scareObjectHitDistance = Infinity;


const zombieHit: {
    target: ZombieState | null;
    distance: number;
} = {
    target: null,
    distance: Infinity,
};

// Dữ liệu dùng để hiển thị hiệu ứng đạn trên client.
let shotOrigin: {
    x: number;
    y: number;
    z: number;
} | null = null;

let shotDirection: {
    x: number;
    y: number;
    z: number;
} | null = null;

if (isRifle) {
    const origin = message?.origin;
    const direction = message?.direction;

    const ox = Number(origin?.x);
    const oy = Number(origin?.y);
    const oz = Number(origin?.z);

    const dx = Number(direction?.x);
    const dy = Number(direction?.y);
    const dz = Number(direction?.z);

    if (![ox, oy, oz, dx, dy, dz].every(Number.isFinite)) {
        this.broadcast("attackPerformed", {
            playerId: client.sessionId,
            action,
            hit: false,
        });
        return;
    }

    const length = Math.hypot(dx, dy, dz);

    if (length < 0.0001) return;

    // Kiểm tra vị trí camera gửi lên.
    const cameraOffset = Math.hypot(
        ox - attacker.x,
        oy - (attacker.y + 1.1),
        oz - attacker.z,
    );

    if (cameraOffset > 10.5) return;

    const dirX = dx / length;
    const dirY = dy / length;
    const dirZ = dz / length;
shotOrigin = {
    x: ox,
    y: oy,
    z: oz,
};

shotDirection = {
    x: dirX,
    y: dirY,
    z: dirZ,
};
  
const HIT_RADIUS = 0.75;

// Kiểm tra nhiều điểm từ chân/thân lên đầu nhân vật.
const HIT_HEIGHTS = [0.45, 1.0, 1.55, 2.0];

this.state.players.forEach((candidate, sessionId) => {
    if (
        sessionId === client.sessionId ||
        !candidate.alive
    ) {
        return;
    }

    for (const height of HIT_HEIGHTS) {
        const tx = candidate.x;
        const ty = candidate.y + height;
        const tz = candidate.z;

        const toX = tx - ox;
        const toY = ty - oy;
        const toZ = tz - oz;

        // Khoảng cách dọc theo tia bắn.
        const alongRay =
            toX * dirX +
            toY * dirY +
            toZ * dirZ;

        if (alongRay < 0 || alongRay > range) {
            continue;
        }

        // Điểm gần nhất trên tia bắn.
        const closestX = ox + dirX * alongRay;
        const closestY = oy + dirY * alongRay;
        const closestZ = oz + dirZ * alongRay;

        const missDistance = Math.hypot(
            tx - closestX,
            ty - closestY,
            tz - closestZ,
        );

        if (
            missDistance <= HIT_RADIUS &&
            alongRay < bestDistance
        ) {
            target = candidate;
            bestDistance = alongRay;
        }
    }
});

// ==================================================
// CHECK ZOMBIE HIT
// Chọn zombie gần nhất trên đường đạn.
// ==================================================

for (const zombie of this.state.zombies.values()) {
    if (!zombie.alive || zombie.hp <= 0) {
        continue;
    }

    const hitHeights = [0.4, 0.9, 1.4, 1.9];
    const hitRadius = 0.75;

    for (const height of hitHeights) {
        const tx = zombie.x;
        const ty = zombie.y + height;
        const tz = zombie.z;

        const toX = tx - ox;
        const toY = ty - oy;
        const toZ = tz - oz;

        const alongRay =
            toX * dirX +
            toY * dirY +
            toZ * dirZ;

        if (alongRay < 0 || alongRay > range) {
            continue;
        }

        const closestX = ox + dirX * alongRay;
        const closestY = oy + dirY * alongRay;
        const closestZ = oz + dirZ * alongRay;

        const missDistance = Math.hypot(
            tx - closestX,
            ty - closestY,
            tz - closestZ,
        );

        if (
            missDistance <= hitRadius &&
            alongRay < zombieHit.distance
        ) {
            zombieHit.target = zombie;
            zombieHit.distance = alongRay;
        }
    }
}

// ==================================================
// CHECK SCARE OBJECT HIT
// Vị trí vật thể phải khớp với ScareObject.tsx
// ==================================================

if (!this.scareObjectDestroyed) {
    const object = this.scareObjectPosition;

    const toX = object.x - ox;
    const toY = object.y - oy;
    const toZ = object.z - oz;

    const alongRay =
        toX * dirX +
        toY * dirY +
        toZ * dirZ;

    if (alongRay >= 0 && alongRay <= range) {
        const closestX = ox + dirX * alongRay;
        const closestY = oy + dirY * alongRay;
        const closestZ = oz + dirZ * alongRay;

        const missDistance = Math.hypot(
            object.x - closestX,
            object.y - closestY,
            object.z - closestZ,
        );

        if (missDistance <= this.scareObjectRadius) {
            scareObjectHitDistance = alongRay;
        }
    }
}

console.log("[ATTACK] Shot result", {
    attacker: client.sessionId,
    hit: target !== null,
    range,
    origin: shotOrigin,
    direction: shotDirection,
});

} else {
    // Đấm tay: giữ cách kiểm tra hướng trước nhân vật.
    const forwardX = Math.sin(attacker.rotation);
    const forwardZ = Math.cos(attacker.rotation);

    this.state.players.forEach((candidate, sessionId) => {
        if (sessionId === client.sessionId || !candidate.alive) {
            return;
        }

        const dx = candidate.x - attacker.x;
        const dz = candidate.z - attacker.z;
        const distance = Math.hypot(dx, dz);

        if (distance > range || distance < 0.001) return;

        const directionX = dx / distance;
        const directionZ = dz / distance;

        const dot =
            forwardX * directionX +
            forwardZ * directionZ;

        if (dot < 0.45) return;

        if (distance < bestDistance) {
            bestDistance = distance;
            target = candidate;
        }
    });
}


// ==================================================
// HANDLE ZOMBIE HIT
// ==================================================

if (
    isRifle &&
    zombieHit.target !== null &&
    zombieHit.distance < bestDistance &&
    zombieHit.distance < scareObjectHitDistance
) {
    const zombie = zombieHit.target;

    const oldHp = zombie.hp;
    const actualDamage = Math.min(oldHp, damage);

    zombie.hp = Math.max(0, oldHp - actualDamage);

    if (zombie.hp <= 0) {
        zombie.hp = 0;
        zombie.alive = false;
        zombie.moving = false;
        zombie.attacking = false;
    }

    console.log("[ZOMBIE] Shot hit", {
        zombieId: zombie.id,
        oldHp,
        damage: actualDamage,
        newHp: zombie.hp,
        alive: zombie.alive,
        hitDistance: zombieHit.distance,
    });

    this.broadcast("zombieDamaged", {
        zombieId: zombie.id,
        attackerId: client.sessionId,
        damage: actualDamage,
        hp: zombie.hp,
        alive: zombie.alive,
    });

    this.broadcast("attackPerformed", {
        playerId: client.sessionId,
        action,
        hit: true,
        targetId: zombie.id,
        origin: shotOrigin,
        direction: shotDirection,
    });

    return;
}


// ==================================================
// HANDLE SCARE OBJECT HIT
// ==================================================

if (
    isRifle &&
    !this.scareObjectDestroyed &&
    scareObjectHitDistance < bestDistance
) {
    const oldHp = this.scareObjectHp;

    this.scareObjectHp = Math.max(
        0,
        this.scareObjectHp - damage,
    );

    const actualDamage =
        oldHp - this.scareObjectHp;

    const destroyed =
        this.scareObjectHp <= 0;

    if (destroyed) {
        this.scareObjectDestroyed = true;
    }

    console.log("[SCARE OBJECT] Hit", {
        attacker: client.sessionId,
        damage: actualDamage,
        hp: this.scareObjectHp,
        destroyed,
    });

    this.broadcast("scareObjectDamaged", {
        objectId: "scare-object-1",
        attackerId: client.sessionId,
        damage: actualDamage,
        hp: this.scareObjectHp,
        maxHp: this.scareObjectMaxHp,
        destroyed,
    });

    this.broadcast("attackPerformed", {
        playerId: client.sessionId,
        action,
        hit: true,
        targetId: "scare-object-1",
        origin: shotOrigin,
        direction: shotDirection,
    });

    if (destroyed) {
        this.broadcast("scareObjectDestroyed", {
            objectId: "scare-object-1",
            attackerId: client.sessionId,
        });

        console.log("[SCARE OBJECT] DESTROYED");
    }

    return;
}

// ==================================================
// KHÔNG TRÚNG NGƯỜI CHƠI HOẶC VẬT THỂ
// ==================================================

if (!target) {
    this.broadcast("attackPerformed", {
        playerId: client.sessionId,
        action,
        hit: false,
        origin: shotOrigin,
        direction: shotDirection,
    });

    return;
}




    const victim = target as PlayerState;
    const actualDamage = Math.min(victim.hp, damage);

    victim.hp = Math.max(0, victim.hp - actualDamage);

    if (victim.hp <= 0) {
        victim.hp = 0;
        victim.alive = false;

        this.clock.setTimeout(() => {
            this.respawnPlayer(victim.id);
        }, RESPAWN_DELAY);
    }

    this.broadcast("playerDamaged", {
        playerId: victim.id,
        attackerId: client.sessionId,
        damage: actualDamage,
        hp: victim.hp,
        alive: victim.alive,
        distance: bestDistance,
        weapon: action,
    });

this.broadcast("attackPerformed", {
    playerId: client.sessionId,
    action,
    hit: true,
    targetId: victim.id,
    origin: shotOrigin,
    direction: shotDirection,
});
});
        // ====================================================
    
        // ====================================================
// HOSPITAL GLB: ZOMBIE SYSTEM
// ====================================================

if (!this.hospitalCollision) {
    throw new Error(
        "[ROOM] HospitalCollision chưa được khởi tạo.",
    );
}

this.zombieSystem = new ZombieSystem({
    state: this.state,
    hospitalCollision: this.hospitalCollision,

    respawnPlayer: (sessionId) => {
        this.respawnPlayer(sessionId);
    },

    broadcast: (type, message) => {
        this.broadcast(type, message);
    },

    setTimeout: (callback, ms) => {
        this.clock.setTimeout(callback, ms);
    },
});

this.zombieSystem.initialize();

this.clock.setInterval(() => {
    this.zombieSystem?.update(this.state.gameOver);
}, 100);

console.log(
    `[ROOM] GLB zombie system ready: ${this.mapId}`,
);

// ====================================================
// ZOMBIE AI
// ====================================================

        console.log(
            `[ROOM] Map: ${this.mapId}`
        );


        // ====================================================
        // ROOM CODE
        // ====================================================

        const roomCode =
            options?.roomCode ??
            generateRoomCode();


        this.setMetadata({
            roomCode,
        });


        this.state.roomCode =
            roomCode;


        console.log(
            `[ROOM] Code: ${this.state.roomCode}`
        );

        console.log(
            `[ROOM] Metadata roomCode: ${roomCode}`
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


        this.clock.setInterval(
            () => {

                if (
                    this.state.gameOver
                ) {
                    return;
                }


                this.state.timeRemaining =
                    Math.max(
                        0,
                        this.state.timeRemaining - 1
                    );


                console.log(
                    `[GAME] Time remaining: ${this.state.timeRemaining}s`
                );


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


this.onMessage("move", (client, message) => {
    if (this.state.gameOver) return;

    const player = this.state.players.get(client.sessionId);
    if (!player || !player.alive) return;

    const requestedX =
        typeof message?.x === "number" &&
        Number.isFinite(message.x)
            ? message.x
            : player.x;

    const requestedZ =
        typeof message?.z === "number" &&
        Number.isFinite(message.z)
            ? message.z
            : player.z;

    const requestedRotation =
        typeof message?.rotation === "number" &&
        Number.isFinite(message.rotation)
            ? message.rotation
            : player.rotation;

    const collision = this.hospitalCollision;
    if (!collision) return;

    let deltaX = requestedX - player.x;
    let deltaZ = requestedZ - player.z;

    // Giới hạn quãng đường cho mỗi message.
    const maxMovePerMessage = 1.0;
    const distance = Math.hypot(deltaX, deltaZ);

    if (distance > maxMovePerMessage) {
        const scale = maxMovePerMessage / distance;
        deltaX *= scale;
        deltaZ *= scale;
    }

    const startX = player.x;
    const startZ = player.z;

    let finalX = startX;
    let finalZ = startZ;

    const canMoveTo = (x: number, z: number) =>
        collision.canMoveTo(
            x,
            z,
            0.4,
            player.y,
            1.8,
        );

    const maxStep = 0.1;
    const steps = Math.max(
        1,
        Math.ceil(
            Math.hypot(deltaX, deltaZ) / maxStep,
        ),
    );

    const stepX = deltaX / steps;
    const stepZ = deltaZ / steps;

    for (let i = 0; i < steps; i++) {
        const nextX = finalX + stepX;

        if (canMoveTo(nextX, finalZ)) {
            finalX = nextX;
        }

        const nextZ = finalZ + stepZ;

        if (canMoveTo(finalX, nextZ)) {
            finalZ = nextZ;
        }
    }

    player.x = finalX;
    player.z = finalZ;
    player.rotation = requestedRotation;

    player.moving =
        Math.abs(finalX - startX) > 0.001 ||
        Math.abs(finalZ - startZ) > 0.001;

    // Chưa chấp nhận Y từ client một cách tùy ý.
    // Để nguyên player.y cho tới khi có xử lý độ cao,
    // cầu thang và mặt sàn từ GLB.
});


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


                if (
                    this.state.gameOver
                ) {

                    console.log(
                        "[BOMB] ❌ Game already over"
                    );

                    return;

                }


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


                if (!player.alive) {

                    console.log(
                        "[BOMB] ❌ Dead player cannot plant bomb"
                    );

                    return;

                }


                // ==================================================
                // BOMB ID
                // ==================================================

                const bombId =
                    `${client.sessionId}-${Date.now()}`;


                // ==================================================
                // CREATE BOMB
                // ==================================================

                const bomb =
                    new BombState();


                bomb.id =
                    bombId;

                bomb.ownerId =
                    client.sessionId;

                bomb.bombType =
                    "normal";


                bomb.x =
                    player.x;

                bomb.y =
                    player.y;

                bomb.z =
                    player.z;


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


                // ==================================================
                // ADD BOMB
                // ==================================================

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


                // ==================================================
                // COUNTDOWN
                // ==================================================

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


                            currentBomb.remaining =
                                Math.max(
                                    0,
                                    remaining
                                );


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
    // GET RANDOM SPAWN POSITION
    // ========================================================

  private getRandomSpawnPosition(): {
    x: number;
    y: number;
    z: number;
} {
    if (!this.hospitalCollision) {
        throw new Error(
            "[SPAWN] HospitalCollision chưa được khởi tạo.",
        );
    }

    const spawnPoints =
        this.hospitalCollision.getSpawnPoints();

    if (spawnPoints.length === 0) {
        throw new Error(
            "[SPAWN] Hospital GLB chưa có marker SPAWN_.",
        );
    }

    const safeSpawnPoints = spawnPoints.filter(
        (spawn) => {
            for (const player of this.state.players.values()) {
                if (!player.alive) continue;

                const distance = distanceXZ(
                    spawn.position.x,
                    spawn.position.z,
                    player.x,
                    player.z,
                );

                if (distance < 4) {
                    return false;
                }
            }

            return true;
        },
    );

    const candidates =
        safeSpawnPoints.length > 0
            ? safeSpawnPoints
            : spawnPoints;

    const selected =
        candidates[
            Math.floor(
                Math.random() * candidates.length,
            )
        ];

    const position = {
        ...selected.position,
    };

    console.log("[SPAWN] Hospital GLB:", {
        x: position.x,
        y: position.y,
        z: position.z,
        safe: safeSpawnPoints.length > 0,
        total: spawnPoints.length,
    });

    return position;
}


    // ========================================================
    // RESPAWN PLAYER
    // ========================================================

    private respawnPlayer(
        sessionId: string
    ) {

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


        if (
            this.state.gameOver
        ) {

            console.log(
                `[RESPAWN] ❌ Game already over: ${sessionId}`
            );

            return;

        }


        const spawn =
            this.getRandomSpawnPosition();


        player.x =
            spawn.x;

        player.y =
            spawn.y;

        player.z =
            spawn.z;

        player.rotation =
            0;


        player.hp =
            MAX_HP;

        player.alive =
            true;


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
            "[BOMB] explodeBomb() CALLED"
        );

        console.log(
            `       bombId: ${bombId}`
        );

        console.log(
            "================================================"
        );


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


        console.log(
            `[BOMB] Checking ${this.state.players.size} players`
        );


        // ====================================================
        // CHECK PLAYERS
        // ====================================================

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


                if (!player.alive) {

                    console.log(
                        "       ☠️ ALREADY DEAD"
                    );

                    return;

                }


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


                if (
                    distance >
                    bomb.radius
                ) {

                    console.log(
                        "       ❌ OUTSIDE EXPLOSION"
                    );

                    return;

                }


                console.log(
                    "       💥 INSIDE EXPLOSION"
                );


                const oldHp =
                    Number(
                        player.hp ??
                        MAX_HP
                    );


                const damage =
                    Math.min(
                        oldHp,
                        bomb.damage
                    );


                const newHp =
                    Math.max(
                        0,
                        oldHp - damage
                    );


                player.hp =
                    newHp;


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


                    this.clock.setTimeout(
                        () => {

                            this.respawnPlayer(
                                sessionId
                            );

                        },
                        RESPAWN_DELAY
                    );

                }


                console.log(
                    `       ❤️ HP: ${oldHp} → ${player.hp}`
                );

                console.log(
                    `       alive: ${player.alive}`
                );


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
            `       roomCode: ${options?.roomCode ?? "none"}`
        );

        console.log(
            `       roomMap: ${this.mapId}`
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
        // CREATE PLAYER
        // ====================================================


const player = new PlayerState();

// ====================================================
// DEFAULT WEAPON STATE
// ====================================================

player.weapon1 = "";
player.weapon2 = "";
player.equippedSlot = 0;
player.ammo = 0;


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

        const spawn =
            this.getRandomSpawnPosition();


        player.x =
            spawn.x;

        player.y =
            spawn.y;

        player.z =
            spawn.z;

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
        // ADD PLAYER
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
            `       map: ${this.mapId}`
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
        
        code?: number,
        
    ) 
    {

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


        const wasHost =
            this.hostSessionId ===
            client.sessionId;


        this.state.players.delete(
            client.sessionId
        );
this.lastAttackAt.delete(client.sessionId);

        console.log(
            `[ROOM] Removed player: ${client.sessionId}`
        );


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


        this.broadcast(
            "hostChanged",
            {
                hostSessionId:
                    this.hostSessionId,
            }
        );


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