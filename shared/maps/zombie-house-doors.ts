export type ZombieHouseDoorConfig = {
    id: string;
    cellX: number;
    cellZ: number;
    axis: "x" | "z";
};

// Tọa độ ô tính từ góc trên bên trái của zombie-house.json.
// Các cửa đặt đúng vào 4 ô trống trên hai tường ngang.
export const ZOMBIE_HOUSE_DOORS: ZombieHouseDoorConfig[] = [
    { id: "door-north-west", cellX: 10, cellZ: 15, axis: "x" },
    { id: "door-north-east", cellX: 19, cellZ: 15, axis: "x" },
    { id: "door-south-west", cellX: 8, cellZ: 23, axis: "x" },
    { id: "door-south-east", cellX: 19, cellZ: 23, axis: "x" },
];

export function doorCellKey(cellX: number, cellZ: number) {
    return `${cellX},${cellZ}`;
}