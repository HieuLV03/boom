
export type MapId =
    | "tropical-village"
    | "city"
    | "desert";


// ============================================================
// SPAWN POINT
// ============================================================

export type MapSpawn = {
    x: number;
    y: number;
    z: number;
};


// ============================================================
// MAP CONFIG
// ============================================================

export type MapConfig = {
    id: MapId;

    name: string;

    worldSize: number;

    groundColor: string;

    skyColor: string;

    fog: boolean;

    spawnPoints: MapSpawn[];
};
