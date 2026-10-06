
export type BombConfig = {

    id: string;

    fuseTime: number;

    radius: number;

    damage: number;

    explosionType:
        | "circle"
        | "large"
        | "cross"
        | "fire";
};


// ============================================================
// BOMB CONFIGS
// ============================================================

export const BOMB_CONFIGS:
    Record<
        string,
        BombConfig
    > = {

    // ========================================================
    // NORMAL
    // ========================================================

    normal: {

        id: "normal",

        fuseTime: 3,

        radius: 4,

        damage: 100,

        explosionType:
            "circle",
    },


    // ========================================================
    // BIG
    // ========================================================

    big: {

        id: "big",

        fuseTime: 4,

        radius: 8,

        damage: 150,

        explosionType:
            "large",
    },


    // ========================================================
    // FIRE
    // ========================================================

    fire: {

        id: "fire",

        fuseTime: 2,

        radius: 5,

        damage: 20,

        explosionType:
            "fire",
    },


    // ========================================================
    // CROSS
    // ========================================================

    cross: {

        id: "cross",

        fuseTime: 3,

        radius: 6,

        damage: 80,

        explosionType:
            "cross",
    },
};
