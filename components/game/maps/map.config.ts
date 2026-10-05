
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

    // ========================================================
    // TROPICAL VILLAGE
    // ========================================================

    "tropical-village": {

        id: "tropical-village",

        name: "Tropical Village",

        worldSize: 100,

        groundColor: "#4d7c0f",

        skyColor: "#87CEEB",

        fog: true,

        spawnPoints: [

            {
                x: 0,
                y: 0,
                z: 8,
            },

            {
                x: 8,
                y: 0,
                z: 8,
            },

            {
                x: -8,
                y: 0,
                z: 8,
            },

            {
                x: 12,
                y: 0,
                z: -8,
            },

        ],
    },


    // ========================================================
    // CITY
    // ========================================================

    city: {

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


    // ========================================================
    // DESERT
    // ========================================================

    desert: {

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
