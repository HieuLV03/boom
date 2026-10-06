"use client";

import type {
    PlayerAppearance,
} from "./types";

import Character from "./Character";

import {
    DEFAULT_APPEARANCE,
} from "./player.config";

import {
    Text,
} from "@react-three/drei";


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

    name?: string;

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

    name = "Player",

}: Props) {

    // ========================================================
    // SAFE NAME
    // ========================================================

    const safeName =
        String(
            name || "Player"
        )
            .trim()
            .slice(0, 20);


    // ========================================================
    // RENDER
    // ========================================================

    return (

        <group

            position={position}

            rotation={[
                0,
                rotation,
                0,
            ]}

        >

            {/* ==================================================
                CHARACTER
            ================================================== */}

            <Character
                appearance={appearance}
            />


            {/* ==================================================
                PLAYER NAME
            ================================================== */}
<Text
    position={[
        0,
        2.65,
        0,
    ]}
    fontSize={0.28}
    color="#ffffff"
    anchorX="center"
    anchorY="middle"
    outlineWidth={0.025}
    outlineColor="#000000"
    renderOrder={100}
>
    {safeName}
</Text>
        </group>

    );

}