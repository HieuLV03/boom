
import mapData from "./tropical-village.json" with {
    type: "json",
};

import {
    createGridMap,
    moveWithWallCollision as moveWithWallCollisionForMap,
} from "./grid-map.js";

const tropicalVillage = createGridMap(mapData);

export const CELL_SIZE = tropicalVillage.CELL_SIZE;
export const MAP_WIDTH = tropicalVillage.MAP_WIDTH;
export const MAP_HEIGHT = tropicalVillage.MAP_HEIGHT;
export const MAZE_MAP = tropicalVillage.MAZE_MAP;

export const getMazeCell = tropicalVillage.getMazeCell;
export const isWalkableCell = tropicalVillage.isWalkableCell;
export const worldToCell = tropicalVillage.worldToCell;
export const cellToWorld = tropicalVillage.cellToWorld;
export const canMoveTo = tropicalVillage.canMoveTo;
export const resolveWallCollision = tropicalVillage.resolveWallCollision;

export const moveWithWallCollision = (
    currentX: number,
    currentZ: number,
    targetX: number,
    targetZ: number,
    radius = 0.4,
) =>
    moveWithWallCollisionForMap(
        tropicalVillage,
        currentX,
        currentZ,
        targetX,
        targetZ,
        radius,
    );

export const getSpawnCells = tropicalVillage.getSpawnCells;
export const getSpawnPositions = tropicalVillage.getSpawnPositions;