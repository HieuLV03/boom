
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


// ============================================================
// TYPES
// ============================================================

export type MazeCell =
    | "#"
    | "."
    | "P";


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

    const row = MAZE_MAP[cellZ];

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

    return getMazeCell(
        cellX,
        cellZ,
    ) !== "#";
}


// ============================================================
// WORLD -> CELL
//
// IMPORTANT:
// Cell boundaries are:
//
// cell center = world position
//
// A cell has size 2:
//
// center - 1
// center + 1
//
// We use FLOOR instead of ROUND so collision
// follows the actual square boundaries.
// ============================================================

export function worldToCell(
    x: number,
    z: number,
) {

    const halfMap =
        Math.floor(MAP_WIDTH / 2);

    const cellX =
        Math.floor(
            (
                x +
                CELL_SIZE / 2
            ) /
            CELL_SIZE
        ) +
        halfMap;

    const cellZ =
        Math.floor(
            (
                z +
                CELL_SIZE / 2
            ) /
            CELL_SIZE
        ) +
        halfMap;

    return {
        cellX,
        cellZ,
    };
}


// ============================================================
// CELL -> WORLD
// ============================================================

export function cellToWorld(
    cellX: number,
    cellZ: number,
) {

    return {
        x:
            (
                cellX -
                Math.floor(MAP_WIDTH / 2)
            ) *
            CELL_SIZE,

        z:
            (
                cellZ -
                Math.floor(MAP_HEIGHT / 2)
            ) *
            CELL_SIZE,
    };
}


// ============================================================
// COLLISION
//
// Player is treated as a circle.
//
// Every wall cell is a 2x2 square.
//
// We check the closest point on every nearby
// wall square against the player radius.
//
// This prevents:
// - walking through walls
// - clipping corners
// - diagonal wall penetration
// - getting too close to walls
// ============================================================

export function canMoveTo(
    x: number,
    z: number,
    radius = 0.45,
): boolean {

    // --------------------------------------------------------
    // Find the cell around the player
    // --------------------------------------------------------

    const centerCell =
        worldToCell(
            x,
            z,
        );

    // --------------------------------------------------------
    // Check nearby cells
    //
    // A player can only collide with nearby walls.
    // --------------------------------------------------------

    for (
        let dz = -1;
        dz <= 1;
        dz++
    ) {

        for (
            let dx = -1;
            dx <= 1;
            dx++
        ) {

            const cellX =
                centerCell.cellX +
                dx;

            const cellZ =
                centerCell.cellZ +
                dz;

            // ------------------------------------------------
            // Ignore walkable cells
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
            // Wall center in world coordinates
            // ------------------------------------------------

            const wall =
                cellToWorld(
                    cellX,
                    cellZ,
                );

            const half =
                CELL_SIZE / 2;

            // ------------------------------------------------
            // Wall rectangle
            // ------------------------------------------------

            const minX =
                wall.x -
                half;

            const maxX =
                wall.x +
                half;

            const minZ =
                wall.z -
                half;

            const maxZ =
                wall.z +
                half;

            // ------------------------------------------------
            // Closest point on wall rectangle
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
            // Distance player -> wall
            // ------------------------------------------------

            const distanceX =
                x -
                closestX;

            const distanceZ =
                z -
                closestZ;

            const distanceSquared =
                (
                    distanceX *
                    distanceX
                ) +
                (
                    distanceZ *
                    distanceZ
                );

            // ------------------------------------------------
            // Collision
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
