import tropicalVillageData from "./tropical-village.json";
import { createGridMap } from "./grid-map";

const maps = {
    "tropical-village": createGridMap(tropicalVillageData),
};

export type MapId = keyof typeof maps;

export function getMapConfig(mapId: string) {
    return maps[mapId as MapId] ?? maps["tropical-village"];
}