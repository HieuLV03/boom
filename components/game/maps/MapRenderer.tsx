
"use client";

import TropicalVillage from "./tropical-village/TropicalVillage";
import ZombieHouse from "./zombie-house/ZombieHouse";

export type MapId = "tropical-village" | "zombie-house";

interface MapRendererProps {
    mapId: MapId;
}

export default function MapRenderer({
    mapId,
}: MapRendererProps) {
    if (mapId === "zombie-house") {
        return <ZombieHouse />;
    }

    return <TropicalVillage />;
}
