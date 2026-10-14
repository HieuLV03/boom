
"use client";

import TropicalVillage from "./tropical-village/TropicalVillage";
import ZombieHouse from "./zombie-house/ZombieHouse";

export type MapId =
    | "tropical-village"
    | "zombie-house";

type Props = {
    mapId: MapId;
};

export default function MapRenderer({ mapId }: Props) {
    switch (mapId) {
        case "zombie-house":
            return <ZombieHouse />;

        case "tropical-village":
        default:
            return <TropicalVillage />;
    }
}
