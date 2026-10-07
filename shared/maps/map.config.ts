
import * as tropicalVillage
    from "./tropical-village/maze.config.js";


// ============================================================
// MAP CONFIG
// ============================================================

export const MAPS = {

    "tropical-village":
        tropicalVillage,

} as const;


// ============================================================
// MAP ID
// ============================================================

export type MapId =
    keyof typeof MAPS;


// ============================================================
// GET MAP
// ============================================================

export function getMapConfig(
    mapId: MapId,
) {

    return MAPS[mapId];

}
