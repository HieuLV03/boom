import type { MapDocument, MapObject } from "./map-types";

function object(
  id: string,
  name: string,
  kind: MapObject["kind"],
  position: [number, number, number],
  scale: [number, number, number],
  color: string,
  collision = true
): MapObject {
  return {
    id,
    name,
    kind,
    color,
    visible: true,
    collision,
    transform: { position, rotation: [0, 0, 0], scale },
  };
}

/**
 * Greybox layout: 20 x 16 world units, two floors.
 * Coordinates are deliberately modular so objects can be edited independently.
 */
export const ZOMBIE_HOUSE_DEFAULT: MapDocument = {
  schemaVersion: 1,
  id: "zombie-house",
  name: "Zombie House - Blockout",
  description: "Two-floor modular house prototype. Replace blockout pieces with Blender GLB assets later.",
  gridSize: 1,
  objects: [
    // Ground floor
    object("f1-floor", "Ground floor", "floor", [0, -0.12, 0], [20, 0.24, 16], "#777d78"),
    object("f1-north", "North exterior wall", "wall", [0, 1.5, -8], [20, 3, 0.25], "#b7afa0"),
    object("f1-south-left", "South wall - left", "wall", [-6, 1.5, 8], [8, 3, 0.25], "#b7afa0"),
    object("f1-south-right", "South wall - right", "wall", [7, 1.5, 8], [6, 3, 0.25], "#b7afa0"),
    object("f1-west", "West exterior wall", "wall", [-10, 1.5, 0], [0.25, 3, 16], "#b7afa0"),
    object("f1-east", "East exterior wall", "wall", [10, 1.5, 0], [0.25, 3, 16], "#b7afa0"),
    object("f1-door", "Front door", "door", [0, 1.1, 8], [1.2, 2.2, 0.2], "#795538"),
    object("f1-room-divider", "Living / hallway divider", "wall", [-2, 1.5, 0], [0.2, 3, 8], "#c6beb0"),
    object("f1-kitchen-divider", "Kitchen divider", "wall", [4, 1.5, -3], [0.2, 3, 10], "#c6beb0"),
    object("f1-table", "Living room table", "table", [-5, 0.65, 2], [2, 1.3, 1.2], "#9b7049"),
    object("f1-chair", "Dining chair", "chair", [2, 0.5, -4], [0.7, 1, 0.7], "#8c6847"),
    object("f1-bed", "Emergency cot", "bed", [7, 0.35, -5], [2.2, 0.7, 1.2], "#6b87a4"),
    object("f1-stairs", "Stairs blockout", "stairs", [0, 0.8, -3], [2.4, 1.6, 4], "#8b8b80"),
    object("player-spawn-1", "Player spawn", "spawn", [-7, 0.05, 5], [0.7, 0.1, 0.7], "#35c46a", false),
    object("zombie-spawn-1", "Zombie spawn - kitchen", "zombie-spawn", [7, 0.05, -1], [0.8, 0.1, 0.8], "#dc4242", false),

    // Upper floor represented as a separate floor plane at Y=3.2
    object("f2-floor", "Upper floor", "floor", [0, 3.08, 0], [20, 0.24, 16], "#8a908b"),
    object("f2-north", "Upper north wall", "wall", [0, 4.7, -8], [20, 3, 0.25], "#b7afa0"),
    object("f2-west", "Upper west wall", "wall", [-10, 4.7, 0], [0.25, 3, 16], "#b7afa0"),
    object("f2-east", "Upper east wall", "wall", [10, 4.7, 0], [0.25, 3, 16], "#b7afa0"),
    object("f2-south-left", "Upper south wall - left", "wall", [-6, 4.7, 8], [8, 3, 0.25], "#b7afa0"),
    object("f2-south-right", "Upper south wall - right", "wall", [7, 4.7, 8], [6, 3, 0.25], "#b7afa0"),
    object("f2-divider", "Bedroom divider", "wall", [2, 4.7, 1], [0.2, 3, 10], "#c6beb0"),
    object("f2-bed", "Bedroom bed", "bed", [-5, 3.45, -4], [2.2, 0.7, 1.3], "#6b87a4"),
    object("f2-table", "Bedroom table", "table", [5, 3.7, -4], [1.2, 0.8, 0.8], "#9b7049"),
    object("zombie-spawn-2", "Zombie spawn - upstairs", "zombie-spawn", [6, 3.2, 5], [0.8, 0.1, 0.8], "#dc4242", false),
  ],
};
