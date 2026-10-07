// ============================================================
// TROPICAL VILLAGE MAZE
// ============================================================

export const CELL_SIZE = 2;

export const MAP_WIDTH = 31;

export const MAP_HEIGHT = 31;


// ============================================================
// MAZE
// ============================================================

export const MAZE_MAP = [
    "###############################",
    "#P....#.....#.....#.....#....P#",
    "#.###.#.###.#.###.#.###.#.###.#",
    "#.....#...#.#...#.#.#...#.....#",
    "#####.###.#.###.#.#.###.#####",
    "#.....#...#.....#.....#...#...#",
    "#.###.#.###.#########.#.###.#.#",
    "#.#...#...#.....#.....#...#.#.#",
    "#.#.#####.#.###.#.###.#####.#.#",
    "#.#.......#.#...#...#.......#.#",
    "#.#######.#.#.#####.#.#######.#",
    "#.........#.#...#...#.........#",
    "###.#######.###.#.#######.###.#",
    "#...#.......#...#.......#...#.#",
    "#.#.#.#####.#.#####.#####.#.#.#",
    "#.#.#.....#.#.....#.....#.#.#.#",
    "#.#.#####.#.#####.#####.#.#.#",
    "#.#.......#...#...#.....#...#.#",
    "#.#######.###.#.###.#######.#.#",
    "#.........#...#.....#.........#",
    "###.#####.#.#########.#####.###",
    "#...#...#.#.....#.....#...#...#",
    "#.###.#.#.#####.#.#####.#.#.#.#",
    "#.....#.#.....#.#.....#.#...#.#",
    "#####.#.#####.#.#.#####.###.#.#",
    "#.....#.....#...#.....#.....#.#",
    "#.###.#####.#####.#####.###.#",
    "#P....#.....#.....#.....#....P#",
    "#.###.#.###.#.###.#.###.#.###.#",
    "#.....#.....#.....#.....#.....#",
    "###############################",
] as const;


export type MazeCell =
    "#" |
    "." |
    "P";


// ============================================================
// GET CELL
// ============================================================

export function getMazeCell(
    cellX: number,
    cellZ: number,
): MazeCell {

    if (
        cellZ < 0 ||
        cellZ >= MAP_HEIGHT
    ) {
        return "#";
    }

    const row =
        MAZE_MAP[cellZ];

    if (
        cellX < 0 ||
        cellX >= MAP_WIDTH
    ) {
        return "#";
    }

    return row[cellX] as MazeCell;

}


// ============================================================
// WALKABLE
// ============================================================

export function isWalkableCell(
    cellX: number,
    cellZ: number,
): boolean {

    return (
        getMazeCell(
            cellX,
            cellZ,
        ) !== "#"
    );

}


// ============================================================
// WORLD → CELL
// ============================================================

export function worldToCell(
    x: number,
    z: number,
) {

    const centerX =
        Math.floor(
            MAP_WIDTH / 2
        );

    const centerZ =
        Math.floor(
            MAP_HEIGHT / 2
        );


    return {

        cellX:
            Math.floor(
                x / CELL_SIZE + 0.5
            ) +
            centerX,

        cellZ:
            Math.floor(
                z / CELL_SIZE + 0.5
            ) +
            centerZ,

    };

}


// ============================================================
// CELL → WORLD
// ============================================================

export function cellToWorld(
    cellX: number,
    cellZ: number,
) {

    const centerX =
        Math.floor(
            MAP_WIDTH / 2
        );

    const centerZ =
        Math.floor(
            MAP_HEIGHT / 2
        );


    return {

        x:
            (
                cellX -
                centerX
            ) *
            CELL_SIZE,

        z:
            (
                cellZ -
                centerZ
            ) *
            CELL_SIZE,

    };

}


// ============================================================
// WALL COLLISION
// ============================================================

function getWallCollision(
    x: number,
    z: number,
    radius: number,
) {

    const center =
        worldToCell(
            x,
            z,
        );


    let pushX = 0;

    let pushZ = 0;

    let collided = false;


    // ========================================================
    // CHECK NEARBY WALLS
    // ========================================================

    for (
        let offsetZ = -2;
        offsetZ <= 2;
        offsetZ++
    ) {

        for (
            let offsetX = -2;
            offsetX <= 2;
            offsetX++
        ) {

            const cellX =
                center.cellX +
                offsetX;

            const cellZ =
                center.cellZ +
                offsetZ;


            if (
                isWalkableCell(
                    cellX,
                    cellZ,
                )
            ) {
                continue;
            }


            const wall =
                cellToWorld(
                    cellX,
                    cellZ,
                );


            const half =
                CELL_SIZE / 2;


            const minX =
                wall.x - half;

            const maxX =
                wall.x + half;

            const minZ =
                wall.z - half;

            const maxZ =
                wall.z + half;


            // =================================================
            // CLOSEST POINT
            // =================================================

            const closestX =
                Math.max(
                    minX,
                    Math.min(
                        x,
                        maxX,
                    ),
                );


            const closestZ =
                Math.max(
                    minZ,
                    Math.min(
                        z,
                        maxZ,
                    ),
                );


            let dx =
                x -
                closestX;

            let dz =
                z -
                closestZ;


            const distanceSquared =
                dx * dx +
                dz * dz;


            // =================================================
            // NO COLLISION
            // =================================================

            if (
                distanceSquared >=
                radius * radius
            ) {
                continue;
            }


            collided = true;


            // =================================================
            // PLAYER IS INSIDE WALL
            // =================================================

            const distance =
                Math.sqrt(
                    distanceSquared
                );


            // =================================================
            // SPECIAL CASE:
            // EXACTLY AT WALL CENTER
            // =================================================

            if (
                distance < 0.000001
            ) {

                const left =
                    Math.abs(
                        x - minX
                    );

                const right =
                    Math.abs(
                        maxX - x
                    );

                const top =
                    Math.abs(
                        z - minZ
                    );

                const bottom =
                    Math.abs(
                        maxZ - z
                    );


                const minimum =
                    Math.min(
                        left,
                        right,
                        top,
                        bottom,
                    );


                if (
                    minimum === left
                ) {
                    pushX -=
                        radius;
                }
                else if (
                    minimum === right
                ) {
                    pushX +=
                        radius;
                }
                else if (
                    minimum === top
                ) {
                    pushZ -=
                        radius;
                }
                else {
                    pushZ +=
                        radius;
                }


                continue;

            }


            // =================================================
            // PUSH PLAYER OUT
            // =================================================

            const penetration =
                radius -
                distance;


            dx /=
                distance;

            dz /=
                distance;


            pushX +=
                dx *
                penetration;

            pushZ +=
                dz *
                penetration;

        }

    }


    return {
        collided,
        pushX,
        pushZ,
    };

}


// ============================================================
// CAN MOVE
// ============================================================

export function canMoveTo(
    x: number,
    z: number,
    radius = 0.4,
): boolean {

    const collision =
        getWallCollision(
            x,
            z,
            radius,
        );


    return !collision.collided;

}


// ============================================================
// RESOLVE COLLISION
// ============================================================
//
// Nếu vị trí hiện tại đã nằm sát / xuyên nhẹ vào wall,
// hàm này đẩy player ra ngoài.
//
// ============================================================

export function resolveWallCollision(
    x: number,
    z: number,
    radius = 0.4,
) {

    const collision =
        getWallCollision(
            x,
            z,
            radius,
        );


    return {

        x:
            x +
            collision.pushX,

        z:
            z +
            collision.pushZ,

    };

}


// ============================================================
// MOVE WITH WALL SLIDING
// ============================================================
//
// Đây là hàm nên dùng ở client.
//
// Nó thử:
//
// 1. Di chuyển X + Z
// 2. Nếu bị block → chỉ X
// 3. Nếu X bị block → chỉ Z
// 4. Nếu vẫn block → giữ nguyên
//
// ============================================================

export function moveWithWallCollision(
    currentX: number,
    currentZ: number,

    targetX: number,
    targetZ: number,

    radius = 0.4,
) {

    // ========================================================
    // TARGET OK
    // ========================================================

    if (
        canMoveTo(
            targetX,
            targetZ,
            radius,
        )
    ) {

        return {
            x: targetX,
            z: targetZ,
        };

    }


    // ========================================================
    // TRY X
    // ========================================================

    if (
        canMoveTo(
            targetX,
            currentZ,
            radius,
        )
    ) {

        return {
            x: targetX,
            z: currentZ,
        };

    }


    // ========================================================
    // TRY Z
    // ========================================================

    if (
        canMoveTo(
            currentX,
            targetZ,
            radius,
        )
    ) {

        return {
            x: currentX,
            z: targetZ,
        };

    }


    // ========================================================
    // NO MOVEMENT
    // ========================================================

    return {
        x: currentX,
        z: currentZ,
    };

}


// ============================================================
// SPAWN CELLS
// ============================================================

export function getSpawnCells() {

    const result: Array<{
        cellX: number;
        cellZ: number;
    }> = [];


    for (
        let cellZ = 0;
        cellZ < MAP_HEIGHT;
        cellZ++
    ) {

        for (
            let cellX = 0;
            cellX < MAP_WIDTH;
            cellX++
        ) {

            if (
                getMazeCell(
                    cellX,
                    cellZ,
                ) === "P"
            ) {

                result.push({
                    cellX,
                    cellZ,
                });

            }

        }

    }


    return result;

}


// ============================================================
// SPAWN POSITIONS
// ============================================================

export function getSpawnPositions() {

    return getSpawnCells().map(
        ({
            cellX,
            cellZ,
        }) =>
            cellToWorld(
                cellX,
                cellZ,
            )
    );

}