
"use client";

import type {
    PlayerAppearance,
} from "./types";

import Character from "./Character";

import {
    DEFAULT_APPEARANCE,
} from "./player.config";


// ============================================================
// TYPES
// ============================================================

type Props = {

    position?: [
        number,
        number,
        number,
    ];

    rotation?: number;

    appearance?: PlayerAppearance;

};


// ============================================================
// PLAYER
// ============================================================

export default function Player({

    position = [
        0,
        0,
        0,
    ],

    rotation = 0,

    appearance = DEFAULT_APPEARANCE,

}: Props) {

    return (

        <group
            position={position}

            rotation={[
                0,
                rotation,
                0,
            ]}
        >

            <Character
                appearance={appearance}
            />

        </group>

    );
}
