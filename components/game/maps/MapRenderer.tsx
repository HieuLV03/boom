
"use client";

import TropicalVillage from "./tropical-village/TropicalVillage";


// ============================================================
// TYPES
// ============================================================

export type MapId =
    | "tropical-village";


// ============================================================
// PROPS
// ============================================================

type Props = {
    mapId: MapId;
};


// ============================================================
// MAP RENDERER
// ============================================================

export default function MapRenderer({
    mapId,
}: Props) {

    switch (mapId) {

        case "tropical-village":
            return (
                <TropicalVillage />
            );

        default:
            return (
                <TropicalVillage />
            );
    }
}
