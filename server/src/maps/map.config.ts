import tropicalVillageData from "../../../shared/maps/tropical-village.json" with {
    type: "json",
};

import zombieHouseData from "../../../shared/maps/zombie-house.json" with {
    type: "json",
};

import { createGridMap } from "../../../shared/maps/grid-map.js";

export const MAPS = {
    "tropical-village": createGridMap(tropicalVillageData),
    "zombie-house": createGridMap(zombieHouseData),
} as const;

export type MapId = keyof typeof MAPS;

export function isMapId(value: unknown): value is MapId {
    return (
        typeof value === "string" &&
        Object.prototype.hasOwnProperty.call(MAPS, value)
    );
}

export function getMapConfig(mapId: string) {
    return isMapId(mapId)
        ? MAPS[mapId]
        : MAPS["tropical-village"];
}
