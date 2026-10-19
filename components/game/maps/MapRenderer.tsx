
"use client";

import HospitalModel from "./zombie-house/HospitalModel";

export type MapId = "hospital";

interface MapRendererProps {
    mapId?: MapId;
}

export default function MapRenderer({
    mapId = "hospital",
}: MapRendererProps) {
    if (mapId === "hospital") {
        return <HospitalModel />;
    }

    return null;
}
