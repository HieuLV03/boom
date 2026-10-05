import type {
    CharacterConfig,
    PlayerAppearance,
} from "./types";


// ============================================================
// CHARACTERS
// ============================================================

export const CHARACTERS: Record<
    string,
    CharacterConfig
> = {

    default: {
        id: "default",

        scale: 1,

        height: 1.8,

        movementSpeed: 5,
    },

};


// ============================================================
// DEFAULT APPEARANCE
// ============================================================

export const DEFAULT_APPEARANCE: PlayerAppearance = {

    characterId: "default",

    hairId: "default",

    topId: "default",

    bottomId: "default",

    shoesId: "default",

    skinColor: "#D99A6C",

    scale: 1,

};