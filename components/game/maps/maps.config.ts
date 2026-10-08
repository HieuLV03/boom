
import type {
    MapConfig,
} from "./types";


// ============================================================
// MAP CONFIGS
// ============================================================

export const MAP_CONFIGS: Record<
    string,
    MapConfig
> = {

    "tropical-village": {

        id: "tropical-village",

        name: "Tropical Village",

        worldSize: 100,

        groundColor: "#4d7c0f",

        skyColor: "#87CEEB",

        fog: true,

        spawnPoints: [
            {
                x: -28,
                y: 0,
                z: -28,
            },

            {
                x: 28,
                y: 0,
                z: -28,
            },

            {
                x: -28,
                y: 0,
                z: 24,
            },

            {
                x: 28,
                y: 0,
                z: 24,
            },
        ],
    },

    "city": {

        id: "city",

        name: "City",

        worldSize: 120,

        groundColor: "#777777",

        skyColor: "#9ED8FF",

        fog: true,

        spawnPoints: [
            {
                x: 0,
                y: 0,
                z: 10,
            },

            {
                x: 10,
                y: 0,
                z: 10,
            },
        ],
    },

    "desert": {

        id: "desert",

        name: "Desert",

        worldSize: 140,

        groundColor: "#D9B36C",

        skyColor: "#F6D99A",

        fog: true,

        spawnPoints: [
            {
                x: 0,
                y: 0,
                z: 10,
            },

            {
                x: -10,
                y: 0,
                z: 10,
            },
        ],
    },
};
