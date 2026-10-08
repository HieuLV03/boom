"use client";

import {
    useMemo,
} from "react";

import type {
    PlayerAppearance,
} from "./types";

import {
    CHARACTERS,
} from "./player.config";


// ============================================================
// TYPES
// ============================================================

type Props = {
    appearance?: PlayerAppearance;
};


// ============================================================
// CHARACTER
// ============================================================

export default function Character({
    appearance,
}: Props) {

    const config =
        useMemo(
            () =>
                CHARACTERS[
                    appearance?.characterId ??
                    "default"
                ] ??
                CHARACTERS.default,
            [
                appearance?.characterId,
            ]
        );


    // ========================================================
    // SCALE
    // ========================================================

    const scale =
        config.scale *
        (appearance?.scale ?? 1);


    // ========================================================
    // SKIN
    // ========================================================

    const skinColor =
        appearance?.skinColor ??
        "#D99A6C";


    return (

        <group
            scale={scale}
        >

            {/* ==================================================
                BODY
                ================================================== */}

            <mesh
                position={[
                    0,
                    1.05,
                    0,
                ]}
                castShadow
            >
                <capsuleGeometry
                    args={[
                        0.38,
                        0.75,
                        8,
                        16,
                    ]}
                />

                <meshStandardMaterial
                    color="#2563EB"
                />
            </mesh>


            {/* ==================================================
                HEAD
                ================================================== */}

            <mesh
                position={[
                    0,
                    1.85,
                    0,
                ]}
                castShadow
            >
                <sphereGeometry
                    args={[
                        0.42,
                        24,
                        24,
                    ]}
                />

                <meshStandardMaterial
                    color={skinColor}
                />
            </mesh>


            {/* ==================================================
                HAIR
                ================================================== */}

            <mesh
                position={[
                    0,
                    2.12,
                    0,
                ]}
                castShadow
            >
                <sphereGeometry
                    args={[
                        0.44,
                        24,
                        12,
                    ]}
                />

                <meshStandardMaterial
                    color="#171717"
                />
            </mesh>


            {/* ==================================================
                LEFT EYE
                ================================================== */}

            <mesh
                position={[
                    -0.14,
                    1.91,
                    0.385,
                ]}
            >
                <sphereGeometry
                    args={[
                        0.055,
                        12,
                        12,
                    ]}
                />

                <meshStandardMaterial
                    color="#111111"
                />
            </mesh>


            {/* ==================================================
                RIGHT EYE
                ================================================== */}

            <mesh
                position={[
                    0.14,
                    1.91,
                    0.385,
                ]}
            >
                <sphereGeometry
                    args={[
                        0.055,
                        12,
                        12,
                    ]}
                />

                <meshStandardMaterial
                    color="#111111"
                />
            </mesh>


            {/* ==================================================
                NOSE
                ================================================== */}

            <mesh
                position={[
                    0,
                    1.82,
                    0.415,
                ]}
            >
                <sphereGeometry
                    args={[
                        0.035,
                        8,
                        8,
                    ]}
                />

                <meshStandardMaterial
                    color={skinColor}
                />
            </mesh>


            {/* ==================================================
                LEFT ARM
                ================================================== */}

            <mesh
                position={[
                    -0.5,
                    1.05,
                    0,
                ]}
                rotation={[
                    0,
                    0,
                    -0.12,
                ]}
                castShadow
            >
                <capsuleGeometry
                    args={[
                        0.11,
                        0.55,
                        6,
                        10,
                    ]}
                />

                <meshStandardMaterial
                    color="#2563EB"
                />
            </mesh>


            {/* ==================================================
                RIGHT ARM
                ================================================== */}

            <mesh
                position={[
                    0.5,
                    1.05,
                    0,
                ]}
                rotation={[
                    0,
                    0,
                    0.12,
                ]}
                castShadow
            >
                <capsuleGeometry
                    args={[
                        0.11,
                        0.55,
                        6,
                        10,
                    ]}
                />

                <meshStandardMaterial
                    color="#2563EB"
                />
            </mesh>


            {/* ==================================================
                LEFT LEG
                ================================================== */}

            <mesh
                position={[
                    -0.19,
                    0.45,
                    0,
                ]}
                castShadow
            >
                <capsuleGeometry
                    args={[
                        0.14,
                        0.55,
                        6,
                        10,
                    ]}
                />

                <meshStandardMaterial
                    color="#111827"
                />
            </mesh>


            {/* ==================================================
                RIGHT LEG
                ================================================== */}

            <mesh
                position={[
                    0.19,
                    0.45,
                    0,
                ]}
                castShadow
            >
                <capsuleGeometry
                    args={[
                        0.14,
                        0.55,
                        6,
                        10,
                    ]}
                />

                <meshStandardMaterial
                    color="#111827"
                />
            </mesh>


            {/* ==================================================
                LEFT SHOE
                ================================================== */}

            <mesh
                position={[
                    -0.19,
                    0.12,
                    -0.08,
                ]}
                castShadow
            >
                <boxGeometry
                    args={[
                        0.3,
                        0.18,
                        0.55,
                    ]}
                />

                <meshStandardMaterial
                    color="#F8FAFC"
                />
            </mesh>


            {/* ==================================================
                RIGHT SHOE
                ================================================== */}

            <mesh
                position={[
                    0.19,
                    0.12,
                    -0.08,
                ]}
                castShadow
            >
                <boxGeometry
                    args={[
                        0.3,
                        0.18,
                        0.55,
                    ]}
                />

                <meshStandardMaterial
                    color="#F8FAFC"
                />
            </mesh>

        </group>

    );
}