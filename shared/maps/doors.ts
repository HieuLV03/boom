
// ============================================================
// ZOMBIE HOUSE - DOOR CONFIG
// ============================================================

export type ZombieHouseDoorConfig = {
    id: string;

    // Tọa độ ô cửa trong zombie-house.json
    cellX: number;
    cellZ: number;

    // Hướng cửa
    axis: "x" | "z";
}

// ============================================================
// DOORS
// ============================================================

export const ZOMBIE_HOUSE_DOORS: ZombieHouseDoorConfig[] = [
    {
        id: "door-north-west",
        cellX: 10,
        cellZ: 15,
        axis: "x",
    },
    {
        id: "door-north-east",
        cellX: 19,
        cellZ: 15,
        axis: "x",
    },
    {
        id: "door-south-west",
        cellX: 8,
        cellZ: 23,
        axis: "x",
    },
    {
        id: "door-south-east",
        cellX: 19,
        cellZ: 23,
        axis: "x",
    },
];

// ============================================================
// HELPERS
// ============================================================

export function doorCellKey(
    cellX: number,
    cellZ: number,
): string {
    return `${cellX},${cellZ}`;
}
