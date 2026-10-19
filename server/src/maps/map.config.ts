
export type MapId = "zombie-house";

export function isMapId(value: unknown): value is MapId {
    return value === "zombie-house";
}
