import tropicalVillageData from "./tropical-village.json";
import zombieHouseData from "./zombie-house.json";
import { createGridMap } from "./grid-map";

const maps = {
    "tropical-village": createGridMap(tropicalVillageData),
    "zombie-house": createGridMap(zombieHouseData),
};

export type MapId = keyof typeof maps;

export function getMapConfig(mapId: string) {
    return maps[mapId as MapId] ?? maps["tropical-village"];
}