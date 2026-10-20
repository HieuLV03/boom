
/**
 * Hospital map configuration.
 *
 * Collision geometry MUST come from hospital.glb.
 * Do not define manual walls, floors, stairs, grids or box colliders here.
 */

export const HOSPITAL_CONFIG = {
    id: "hospital",
    modelUrl: "/models/houses/hospital/hospital.glb",

    collision: {
        source: "glb-mesh",
        includeAllMeshes: true,
    },

    // Physics dimensions of the player, not map colliders.
    player: {
        radius: 0.35,
        height: 1.8,
    },
} as const;

export const HOSPITAL_MODEL_URL =
    HOSPITAL_CONFIG.modelUrl;
