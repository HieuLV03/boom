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

    hp?: number;

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

    hp = 100,

}: Props) {

    // ========================================================
    // SAFE HP
    // ========================================================

    const safeHp =
        Math.max(
            0,
            Math.min(
                100,
                Number(hp) || 0
            )
        );

    const hpPercent =
        safeHp / 100;


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
                HP BAR
            ================================================== */}

            <group
                position={[
                    0,
                    2.65,
                    0,
                ]}
            >

                {/* ==================================================
                    HP BAR BACKGROUND
                ================================================== */}

                <mesh>

                    <planeGeometry
                        args={[
                            1.2,
                            0.12,
                        ]}
                    />

                    <meshBasicMaterial
                        color="#222222"
                        depthTest={false}
                    />

                </mesh>


                {/* ==================================================
                    HP BAR
                ================================================== */}

                {safeHp > 0 && (

                    <mesh

                        position={[
                            -0.6 +
                                (
                                    1.2 *
                                    hpPercent
                                ) / 2,

                            0,

                            0.01,
                        ]}

                        scale={[
                            hpPercent,
                            1,
                            1,
                        ]}

                    >

                        <planeGeometry
                            args={[
                                1.2,
                                0.12,
                            ]}
                        />

                        <meshBasicMaterial
                            color="#22C55E"
                            depthTest={false}
                        />

                    </mesh>

                )}

            </group>

        </group>

    );
}