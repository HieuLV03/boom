export type PlayerAppearance = {
    characterId: string;

    hairId: string;
    topId: string;
    bottomId: string;
    shoesId: string;

    skinColor: string;

    scale: number;
};

export type CharacterConfig = {
    id: string;

    scale: number;

    height: number;

    movementSpeed: number;
};