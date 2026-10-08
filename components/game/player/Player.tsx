"use client";

import type {
    PlayerAppearance,
} from "./types";

import Character3D from "./Character3D";

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

    moving?: boolean;
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

    moving = false,

}: Props) {

    const safeName =
        String(
            name || "Player"
        )
            .trim()
            .slice(
                0,
                20
            );


    return (

        <group
            position={position}
        >

            {/* =================================================
                CHARACTER
            ================================================= */}

            <group
                rotation={[
                    0,
                    rotation,
                    0,
                ]}
            >

                <Character3D
                    moving={moving}
                />

            </group>


            {/* =================================================
                PLAYER NAME
            ================================================= */}

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