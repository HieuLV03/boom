
export type MapId = "hospital";

export function isMapId(value: unknown): value is MapId {
    return value === "hospital";
}
