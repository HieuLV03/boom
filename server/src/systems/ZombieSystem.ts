
// server/src/systems/ZombieSystem.ts

import {
    BattleState,
    PlayerState,
    ZombieState,
} from "../schema/BattleState.js";

import {
    getMapConfig,
    type MapId,
} from "../maps/map.config.js";

import { doorCellKey } from "../../../shared/maps/doors.js";

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

// ============================================================
// TYPES
// ============================================================

type Position = {
    x: number;
    y: number;
    z: number;
};

type GridCell = {
    x: number;
    z: number;
};

type ZombieContext = {
    state: BattleState;
    mapId: MapId;

    getClosedDoorCells: () => Set<string>;

    getRandomWalkablePosition: () => Position;

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
    return Math.hypot(
        x1 - x2,
        z1 - z2,
    );
}

function cellKey(
    x: number,
    z: number,
): string {
    return `${x},${z}`;
}

// ============================================================
// ZOMBIE SYSTEM
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
    // INITIALIZE / SPAWN
    // ========================================================

    initialize(): void {
        const {
            state,
            mapId,
            getRandomWalkablePosition,
        } = this.context;

        state.zombies.clear();
        this.zombieAttackAt.clear();
        this.lastUpdateAt = 0;

        // Chỉ spawn zombie ở map nhà zombie.
        if (String(mapId) !== "zombie-house") {
            return;
        }

        for (let i = 0; i < ZOMBIE_COUNT; i++) {
            const position =
                getRandomWalkablePosition();

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

            state.zombies.set(
                zombie.id,
                zombie,
            );
        }

        console.log(
            `[ZOMBIE] Spawned ${state.zombies.size} zombies`,
        );
    }

    // ========================================================
    // UPDATE AI
    // ========================================================

    update(gameOver: boolean): void {
        const {
            state,
            mapId,
            getClosedDoorCells,
        } = this.context;

        if (
            gameOver ||
            String(mapId) !== "zombie-house"
        ) {
            return;
        }

        const now = Date.now();

        // Chỉ cập nhật AI mỗi 100 ms.
        if (
            this.lastUpdateAt !== 0 &&
            now - this.lastUpdateAt <
                ZOMBIE_UPDATE_INTERVAL
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

        const map = getMapConfig(mapId);
        const blockedDoors =
            getClosedDoorCells();

        state.zombies.forEach((zombie) => {
            if (!zombie.alive) {
                zombie.moving = false;
                zombie.attacking = false;
                return;
            }

            const target =
                this.findNearestPlayer(zombie);

            zombie.attacking = false;

            if (!target) {
                zombie.moving = false;
                return;
            }

            const dx = target.x - zombie.x;
            const dz = target.z - zombie.z;

            const distance = Math.hypot(dx, dz);

            // Quay về phía người chơi.
            zombie.rotation = Math.atan2(dx, dz);

            // ------------------------------------------------
            // ATTACK PLAYER
            // ------------------------------------------------

            if (distance <= ZOMBIE_ATTACK_RANGE) {
                zombie.moving = false;

                const lastAttack =
                    this.zombieAttackAt.get(
                        zombie.id,
                    ) ?? 0;

                if (
                    now - lastAttack <
                    ZOMBIE_ATTACK_COOLDOWN
                ) {
                    return;
                }

                this.zombieAttackAt.set(
                    zombie.id,
                    now,
                );

                zombie.attacking = true;

                const damage = Math.min(
                    target.hp,
                    ZOMBIE_DAMAGE,
                );

                target.hp = Math.max(
                    0,
                    target.hp - damage,
                );

                if (target.hp <= 0) {
                    target.hp = 0;
                    target.alive = false;

                    this.context.setTimeout(() => {
                        this.context.respawnPlayer(
                            target.id,
                        );
                    }, RESPAWN_DELAY);
                }

                this.context.broadcast(
                    "playerDamaged",
                    {
                        playerId: target.id,
                        attackerId: zombie.id,
                        damage,
                        hp: target.hp,
                        alive: target.alive,
                        distance,
                        weapon: "zombie",
                    },
                );

                this.context.broadcast(
                    "zombieBite",
                    {
                        zombieId: zombie.id,
                        playerId: target.id,
                        damage,
                    },
                );

                return;
            }

            // ------------------------------------------------
            // FIND PATH TO PLAYER
            // ------------------------------------------------

            const nextCell = this.findNextCell(
                zombie.x,
                zombie.z,
                target.x,
                target.z,
                blockedDoors,
            );

            if (!nextCell) {
                zombie.moving = false;
                return;
            }

            const centerX = Math.floor(
                map.MAP_WIDTH / 2,
            );

            const centerZ = Math.floor(
                map.MAP_HEIGHT / 2,
            );

            const waypointX =
                (nextCell.x - centerX) *
                map.CELL_SIZE;

            const waypointZ =
                (nextCell.z - centerZ) *
                map.CELL_SIZE;

            const moveX =
                waypointX - zombie.x;

            const moveZ =
                waypointZ - zombie.z;

            const moveDistance = Math.hypot(
                moveX,
                moveZ,
            );

            if (moveDistance < 0.001) {
                zombie.moving = false;
                return;
            }

            const step = Math.min(
                ZOMBIE_SPEED * deltaTime,
                moveDistance,
            );

            const nextX =
                zombie.x +
                (moveX / moveDistance) * step;

            const nextZ =
                zombie.z +
                (moveZ / moveDistance) * step;

            let moved = false;

            // Va chạm trục X.
            if (
                map.canMoveTo(
                    nextX,
                    zombie.z,
                    ZOMBIE_COLLISION_RADIUS,
                    blockedDoors,
                )
            ) {
                zombie.x = nextX;
                moved = true;
            }

            // Va chạm trục Z.
            if (
                map.canMoveTo(
                    zombie.x,
                    nextZ,
                    ZOMBIE_COLLISION_RADIUS,
                    blockedDoors,
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

        this.context.state.players.forEach(
            (player) => {
                if (
                    !player.alive ||
                    player.hp <= 0
                ) {
                    return;
                }

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
            },
        );

        return nearest;
    }

    // ========================================================
    // BFS PATHFINDING
    // ========================================================

    private findNextCell(
        startX: number,
        startZ: number,
        targetX: number,
        targetZ: number,
        blockedDoors: Set<string>,
    ): GridCell | null {
        const map = getMapConfig(
            this.context.mapId,
        );

        const {
            CELL_SIZE,
            MAP_WIDTH,
            MAP_HEIGHT,
            MAZE_MAP,
        } = map;

        const centerX = Math.floor(
            MAP_WIDTH / 2,
        );

        const centerZ = Math.floor(
            MAP_HEIGHT / 2,
        );

        // World position -> grid cell.
        const toCell = (
            x: number,
            z: number,
        ): GridCell => ({
            x: Math.max(
                0,
                Math.min(
                    MAP_WIDTH - 1,
                    Math.round(
                        x / CELL_SIZE + centerX,
                    ),
                ),
            ),

            z: Math.max(
                0,
                Math.min(
                    MAP_HEIGHT - 1,
                    Math.round(
                        z / CELL_SIZE + centerZ,
                    ),
                ),
            ),
        });

        const start = toCell(
            startX,
            startZ,
        );

        const target = toCell(
            targetX,
            targetZ,
        );

        const startKey = cellKey(
            start.x,
            start.z,
        );

        const targetKey = cellKey(
            target.x,
            target.z,
        );

        if (startKey === targetKey) {
            return target;
        }

        const queue: GridCell[] = [start];

        const visited = new Set<string>([
            startKey,
        ]);

        const parent = new Map<
            string,
            GridCell | null
        >();

        parent.set(startKey, null);

        const directions: GridCell[] = [
            { x: 1, z: 0 },
            { x: -1, z: 0 },
            { x: 0, z: 1 },
            { x: 0, z: -1 },
        ];

        let found = false;

        // Breadth-first search.
        for (
            let head = 0;
            head < queue.length;
            head++
        ) {
            const current = queue[head];

            if (!current) {
                continue;
            }

            const currentKey = cellKey(
                current.x,
                current.z,
            );

            if (currentKey === targetKey) {
                found = true;
                break;
            }

            for (const direction of directions) {
                const nextX =
                    current.x + direction.x;

                const nextZ =
                    current.z + direction.z;

                // Không đi ra ngoài map.
                if (
                    nextX < 0 ||
                    nextX >= MAP_WIDTH ||
                    nextZ < 0 ||
                    nextZ >= MAP_HEIGHT
                ) {
                    continue;
                }

                const row = MAZE_MAP[nextZ];

                // Không đi xuyên tường.
                if (
                    !row ||
                    row[nextX] === "#"
                ) {
                    continue;
                }

                // Không đi xuyên cửa đang đóng.
                if (
                    blockedDoors.has(
                        doorCellKey(
                            nextX,
                            nextZ,
                        ),
                    )
                ) {
                    continue;
                }

                const nextKey = cellKey(
                    nextX,
                    nextZ,
                );

                if (visited.has(nextKey)) {
                    continue;
                }

                const worldX =
                    (nextX - centerX) *
                    CELL_SIZE;

                const worldZ =
                    (nextZ - centerZ) *
                    CELL_SIZE;

                // Kiểm tra va chạm của map.
                if (
                    !map.canMoveTo(
                        worldX,
                        worldZ,
                        ZOMBIE_COLLISION_RADIUS,
                        blockedDoors,
                    )
                ) {
                    continue;
                }

                visited.add(nextKey);

                parent.set(
                    nextKey,
                    current,
                );

                queue.push({
                    x: nextX,
                    z: nextZ,
                });
            }
        }

        if (!found) {
            return null;
        }

        // Truy ngược để tìm ô đầu tiên trên đường đi.
        let current = target;

        while (true) {
            const previous = parent.get(
                cellKey(
                    current.x,
                    current.z,
                ),
            );

            if (
                !previous ||
                cellKey(
                    previous.x,
                    previous.z,
                ) === startKey
            ) {
                return current;
            }

            current = previous;
        }
    }
}
