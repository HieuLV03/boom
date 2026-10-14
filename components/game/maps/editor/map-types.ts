export type MapObjectKind =
  | "floor"
  | "wall"
  | "door"
  | "table"
  | "bed"
  | "chair"
  | "stairs"
  | "spawn"
  | "zombie-spawn";

export type Transform3 = {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
};

export type MapObject = {
  id: string;
  name: string;
  kind: MapObjectKind;
  transform: Transform3;
  color: string;
  visible: boolean;
  collision: boolean;
};

export type MapDocument = {
  schemaVersion: 1;
  id: string;
  name: string;
  description: string;
  gridSize: number;
  objects: MapObject[];
};

export const OBJECT_DEFAULTS: Record<
  MapObjectKind,
  Omit<MapObject, "id" | "transform">
> = {
  floor: {
    name: "Floor",
    kind: "floor",
    color: "#777d78",
    visible: true,
    collision: true,
  },
  wall: {
    name: "Wall",
    kind: "wall",
    color: "#b7afa0",
    visible: true,
    collision: true,
  },
  door: {
    name: "Door",
    kind: "door",
    color: "#795538",
    visible: true,
    collision: true,
  },
  table: {
    name: "Table",
    kind: "table",
    color: "#9b7049",
    visible: true,
    collision: true,
  },
  bed: {
    name: "Bed",
    kind: "bed",
    color: "#6b87a4",
    visible: true,
    collision: true,
  },
  chair: {
    name: "Chair",
    kind: "chair",
    color: "#8c6847",
    visible: true,
    collision: true,
  },
  stairs: {
    name: "Stairs",
    kind: "stairs",
    color: "#8b8b80",
    visible: true,
    collision: true,
  },
  spawn: {
    name: "Player Spawn",
    kind: "spawn",
    color: "#35c46a",
    visible: true,
    collision: false,
  },
  "zombie-spawn": {
    name: "Zombie Spawn",
    kind: "zombie-spawn",
    color: "#dc4242",
    visible: true,
    collision: false,
  },
};

export function createMapObject(kind: MapObjectKind, index: number): MapObject {
  const defaults = OBJECT_DEFAULTS[kind];
  const dimensions: Record<MapObjectKind, [number, number, number]> = {
    floor: [8, 0.2, 8],
    wall: [4, 3, 0.25],
    door: [1.2, 2.2, 0.18],
    table: [1.6, 0.9, 1],
    bed: [2, 0.6, 1.2],
    chair: [0.6, 1, 0.6],
    stairs: [2, 1.5, 3],
    spawn: [0.6, 0.1, 0.6],
    "zombie-spawn": [0.7, 0.1, 0.7],
  };
  return {
    id: `${kind}-${Date.now()}-${index}`,
    ...defaults,
    transform: {
      position: [index % 4 * 1.5, 0, Math.floor(index / 4) * 1.5],
      rotation: [0, 0, 0],
      scale: dimensions[kind],
    },
  };
}
