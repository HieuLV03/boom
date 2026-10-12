
 // ============================================================
 // OPEN ARENA MAP
 // ============================================================

export const CELL_SIZE = 2;

export const MAP_WIDTH = 31;
export const MAP_HEIGHT = 31;

// # = tường
// . = đất trống
// P = vị trí spawn
//
// Map đấu trường mở: ít vật cản, dễ di chuyển.

export const MAZE_MAP = [
    "###############################",
    "#P...........................P#",
    "#.............................#",
    "#.............................#",
    "#.............................#",
    "#.....###.............###.....#",
    "#.....###.............###.....#",
    "#.............................#",
    "#.............................#",
    "#...........##.##.............#",
    "#...........##.##.............#",
    "#.............................#",
    "#.............................#",
    "#.............................#",
    "#.............................#",
    "#.............................#",
    "#.............................#",
    "#.............................#",
    "#...........##.##.............#",
    "#...........##.##.............#",
    "#.............................#",
    "#.............................#",
    "#.....###.............###.....#",
    "#.....###.............###.....#",
    "#.............................#",
    "#.............................#",
    "#.............................#",
    "#.............................#",
    "#P...........................P#",
    "#.............................#",
    "###############################",
] as const;

export type MazeCell = "#" | "." | "P";

export function getMazeCell(
    cellX: number,
    cellZ: number,
): MazeCell {
    if (
        cellZ < 0 ||
        cellZ >= MAP_HEIGHT ||
        cellX < 0 ||
        cellX >= MAP_WIDTH
    ) {
        return "#";
    }

    return MAZE_MAP[cellZ][cellX] as MazeCell;
}

export function isWalkableCell(
    cellX: number,
    cellZ: number,
): boolean {
    return getMazeCell(cellX, cellZ) !== "#";
}

export function worldToCell(x: number, z: number) {
    const centerX = Math.floor(MAP_WIDTH / 2);
    const centerZ = Math.floor(MAP_HEIGHT / 2);

    return {
        cellX: Math.floor(x / CELL_SIZE + 0.5) + centerX,
        cellZ: Math.floor(z / CELL_SIZE + 0.5) + centerZ,
    };
}

export function cellToWorld(cellX: number, cellZ: number) {
    const centerX = Math.floor(MAP_WIDTH / 2);
    const centerZ = Math.floor(MAP_HEIGHT / 2);

    return {
        x: (cellX - centerX) * CELL_SIZE,
        z: (cellZ - centerZ) * CELL_SIZE,
    };
}

function getWallCollision(
    x: number,
    z: number,
    radius: number,
) {
    const center = worldToCell(x, z);

    let pushX = 0;
    let pushZ = 0;
    let collided = false;

    for (let offsetZ = -2; offsetZ <= 2; offsetZ++) {
        for (let offsetX = -2; offsetX <= 2; offsetX++) {
            const cellX = center.cellX + offsetX;
            const cellZ = center.cellZ + offsetZ;

            if (isWalkableCell(cellX, cellZ)) continue;

            const wall = cellToWorld(cellX, cellZ);
            const half = CELL_SIZE / 2;

            const minX = wall.x - half;
            const maxX = wall.x + half;
            const minZ = wall.z - half;
            const maxZ = wall.z + half;

            const closestX = Math.max(minX, Math.min(x, maxX));
            const closestZ = Math.max(minZ, Math.min(z, maxZ));

            let dx = x - closestX;
            let dz = z - closestZ;

            const distanceSquared = dx * dx + dz * dz;

            if (distanceSquared >= radius * radius) continue;

            collided = true;

            const distance = Math.sqrt(distanceSquared);

            if (distance < 1e-10) {
                const sides = [
                    { distance: Math.abs(x - minX), x: -1, z: 0 },
                    { distance: Math.abs(maxX - x), x: 1, z: 0 },
                    { distance: Math.abs(z - minZ), x: 0, z: -1 },
                    { distance: Math.abs(maxZ - z), x: 0, z: 1 },
                ];

                sides.sort((a, b) => a.distance - b.distance);

                pushX += sides[0].x * radius;
                pushZ += sides[0].z * radius;
                continue;
            }

            const penetration = radius - distance;

            dx /= distance;
            dz /= distance;

            pushX += dx * penetration;
            pushZ += dz * penetration;
        }
    }

    return { collided, pushX, pushZ };
}

export function canMoveTo(
    x: number,
    z: number,
    radius = 0.4,
): boolean {
    return !getWallCollision(x, z, radius).collided;
}

export function resolveWallCollision(
    x: number,
    z: number,
    radius = 0.4,
) {
    const collision = getWallCollision(x, z, radius);

    return {
        x: x + collision.pushX,
        z: z + collision.pushZ,
    };
}

export function moveWithWallCollision(
    currentX: number,
    currentZ: number,
    targetX: number,
    targetZ: number,
    radius = 0.4,
) {
    if (canMoveTo(targetX, targetZ, radius)) {
        return { x: targetX, z: targetZ };
    }

    if (canMoveTo(targetX, currentZ, radius)) {
        return { x: targetX, z: currentZ };
    }

    if (canMoveTo(currentX, targetZ, radius)) {
        return { x: currentX, z: targetZ };
    }

    return { x: currentX, z: currentZ };
}

export function getSpawnCells() {
    const result: Array<{ cellX: number; cellZ: number }> = [];

    for (let cellZ = 0; cellZ < MAP_HEIGHT; cellZ++) {
        for (let cellX = 0; cellX < MAP_WIDTH; cellX++) {
            if (getMazeCell(cellX, cellZ) === "P") {
                result.push({ cellX, cellZ });
            }
        }
    }

    return result;
}

export function getSpawnPositions() {
    return getSpawnCells().map(({ cellX, cellZ }) =>
        cellToWorld(cellX, cellZ),
    );
}
