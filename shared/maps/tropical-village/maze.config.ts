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
        cellZ >= MAZE_MAP.length
    ) {
        return "#";
    }

    const row =
        MAZE_MAP[cellZ];

    if (
        cellX < 0 ||
        cellX >= row.length
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
//
// World:
//   center = 0,0
//
// Cell:
//   center cell = 15,15
//
// CELL_SIZE = 2
//
// Ví dụ:
//
// cell 15 → world 0
// cell 16 → world 2
// cell 14 → world -2
//
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


    const cellX =
        Math.floor(
            x / CELL_SIZE + 0.5
        ) +
        centerX;


    const cellZ =
        Math.floor(
            z / CELL_SIZE + 0.5
        ) +
        centerZ;


    return {
        cellX,
        cellZ,
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
// CIRCLE VS WALL
// ============================================================
//
// Player = circle
// Wall   = square
//
// Không dùng 4 góc player nữa.
//
// Điều này giúp player:
//
// - đi sát tường
// - trượt dọc tường
// - không bị kẹt ở góc
// - không bị "dính" khi đi chéo
//
// ============================================================

export function canMoveTo(
    x: number,
    z: number,
    radius = 0.45,
): boolean {

    const center =
        worldToCell(
            x,
            z,
        );


    // ========================================================
    // CHECK NEARBY CELLS
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


            // ------------------------------------------------
            // WALKABLE
            // ------------------------------------------------

            if (
                isWalkableCell(
                    cellX,
                    cellZ,
                )
            ) {
                continue;
            }


            // ------------------------------------------------
            // WALL CENTER
            // ------------------------------------------------

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


            // ------------------------------------------------
            // CLOSEST POINT ON WALL
            // ------------------------------------------------

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


            // ------------------------------------------------
            // DISTANCE
            // ------------------------------------------------

            const dx =
                x -
                closestX;

            const dz =
                z -
                closestZ;


            const distanceSquared =
                dx * dx +
                dz * dz;


            // ------------------------------------------------
            // COLLISION
            // ------------------------------------------------

            if (
                distanceSquared <
                radius * radius
            ) {

                return false;

            }

        }

    }


    return true;

}


// ============================================================
// SPAWN POINTS
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
// SPAWN WORLD POSITIONS
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