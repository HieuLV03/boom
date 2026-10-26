
export interface GridMapData {
    id: string;
    cellSize: number;
    width: number;
    height: number;
    cells: readonly string[];
}

export function createGridMap(data: GridMapData) {
    const {
        cellSize: CELL_SIZE,
        width: MAP_WIDTH,
        height: MAP_HEIGHT,
        cells: MAZE_MAP,
    } = data;

    type MazeCell = "#" | "." | "P";

    function getMazeCell(
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

        return (MAZE_MAP[cellZ]?.[cellX] ?? "#") as MazeCell;
    }

    function isWalkableCell(
        cellX: number,
        cellZ: number,
    ): boolean {
        return getMazeCell(cellX, cellZ) !== "#";
    }

    function worldToCell(x: number, z: number) {
        const centerX = Math.floor(MAP_WIDTH / 2);
        const centerZ = Math.floor(MAP_HEIGHT / 2);

        return {
            cellX: Math.floor(x / CELL_SIZE + 0.5) + centerX,
            cellZ: Math.floor(z / CELL_SIZE + 0.5) + centerZ,
        };
    }

    function cellToWorld(cellX: number, cellZ: number) {
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
    blockedCells?: ReadonlySet<string>,
) {
    const center = worldToCell(x, z);

    let pushX = 0;
    let pushZ = 0;
    let collided = false;

    for (let offsetZ = -2; offsetZ <= 2; offsetZ++) {
        for (let offsetX = -2; offsetX <= 2; offsetX++) {
            const cellX = center.cellX + offsetX;
            const cellZ = center.cellZ + offsetZ;

            const isClosedDoor = blockedCells?.has(
                `${cellX},${cellZ}`,
            ) ?? false;

            if (
                isWalkableCell(cellX, cellZ) &&
                !isClosedDoor
            ) {
                continue;
            }

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

  function canMoveTo(
    x: number,
    z: number,
    radius = 0.4,
    blockedCells?: ReadonlySet<string>,
): boolean {
    return !getWallCollision(
        x,
        z,
        radius,
        blockedCells,
    ).collided;
}

function resolveWallCollision(
    x: number,
    z: number,
    radius = 0.4,
    blockedCells?: ReadonlySet<string>,
) {
    const collision = getWallCollision(
        x,
        z,
        radius,
        blockedCells,
    );

    return {
        x: x + collision.pushX,
        z: z + collision.pushZ,
    };
}
  

    function getSpawnCells() {
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

    function getSpawnPositions() {
        return getSpawnCells().map(({ cellX, cellZ }) =>
            cellToWorld(cellX, cellZ),
        );
    }

    return {
        CELL_SIZE,
        MAP_WIDTH,
        MAP_HEIGHT,
        MAZE_MAP,
        getMazeCell,
        isWalkableCell,
        worldToCell,
        cellToWorld,
        canMoveTo,
        resolveWallCollision,
        getSpawnCells,
        getSpawnPositions,
    };
}

export function moveWithWallCollision(
    map: ReturnType<typeof createGridMap>,
    currentX: number,
    currentZ: number,
    targetX: number,
    targetZ: number,
    radius = 0.4,
    blockedCells?: ReadonlySet<string>,
) {
    if (map.canMoveTo(targetX, targetZ, radius, blockedCells)) {
        return { x: targetX, z: targetZ };
    }

    if (map.canMoveTo(targetX, currentZ, radius, blockedCells)) {
        return { x: targetX, z: currentZ };
    }

    if (map.canMoveTo(currentX, targetZ, radius, blockedCells)) {
        return { x: currentX, z: targetZ };
    }

    return { x: currentX, z: currentZ };
}
