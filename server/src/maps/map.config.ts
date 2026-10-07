import * as tropicalVillage
    from "./tropical-village/maze.config.js";


export const MAPS = {
    "tropical-village": tropicalVillage,
} as const;


export type MapId =
    keyof typeof MAPS;


export function getMapConfig(
    mapId: MapId
) {
    return MAPS[mapId];
}