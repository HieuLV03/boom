
"use client";

import { useRef } from "react";

import * as THREE from "three";


// ============================================================
// TYPES
// ============================================================

type Props = {
    position?: [number, number, number];
    rotation?: number;
};


// ============================================================
// PLAYER
// ============================================================

export default function Player({
    position = [0, 0, 0],
    rotation = 0,
}: Props) {

    const groupRef =
        useRef<THREE.Group>(null);


    return (
    <group
    ref={groupRef}
    position={position}
    rotation={[
        0,
        rotation + Math.PI,
        0,
    ]}
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
                        0.8,
                        4,
                        8,
                    ]}
                />

                <meshStandardMaterial
                    color="#2563eb"
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
                        0.3,
                        20,
                        20,
                    ]}
                />

                <meshStandardMaterial
                    color="#f2c29b"
                />
            </mesh>


            {/* ==================================================
                HAIR
            ================================================== */}

        <mesh
    position={[
        0,
        2.08,
        0,
    ]}
    scale={[
        1,
        0.55,
        1,
    ]}
    castShadow
>
    <sphereGeometry
        args={[
            0.31,
            20,
            12,
        ]}
    />

    <meshStandardMaterial
        color="#111827"
    />
</mesh>

            {/* ==================================================
                LEFT EYE
                Front = -Z
            ================================================== */}

            <mesh
                position={[
                    -0.105,
                    1.88,
                    -0.27,
                ]}
            >
                <sphereGeometry
                    args={[
                        0.045,
                        12,
                        12,
                    ]}
                />

                <meshStandardMaterial
                    color="#ffffff"
                />
            </mesh>


            {/* ==================================================
                RIGHT EYE
            ================================================== */}

            <mesh
                position={[
                    0.105,
                    1.88,
                    -0.27,
                ]}
            >
                <sphereGeometry
                    args={[
                        0.045,
                        12,
                        12,
                    ]}
                />

                <meshStandardMaterial
                    color="#ffffff"
                />
            </mesh>


            {/* ==================================================
                LEFT PUPIL
            ================================================== */}

            <mesh
                position={[
                    -0.105,
                    1.88,
                    -0.305,
                ]}
            >
                <sphereGeometry
                    args={[
                        0.022,
                        10,
                        10,
                    ]}
                />

                <meshStandardMaterial
                    color="#111111"
                />
            </mesh>


            {/* ==================================================
                RIGHT PUPIL
            ================================================== */}

            <mesh
                position={[
                    0.105,
                    1.88,
                    -0.305,
                ]}
            >
                <sphereGeometry
                    args={[
                        0.022,
                        10,
                        10,
                    ]}
                />

                <meshStandardMaterial
                    color="#111111"
                />
            </mesh>


            {/* ==================================================
                NOSE
                Front marker
            ================================================== */}

            <mesh
                position={[
                    0,
                    1.80,
                    -0.31,
                ]}
                rotation={[
                    Math.PI / 2,
                    0,
                    0,
                ]}
            >
                <coneGeometry
                    args={[
                        0.055,
                        0.12,
                        8,
                    ]}
                />

                <meshStandardMaterial
                    color="#d99070"
                />
            </mesh>


            {/* ==================================================
                CHEST LOGO
                Helps identify front
            ================================================== */}

            <mesh
                position={[
                    0,
                    1.2,
                    -0.385,
                ]}
            >
                <circleGeometry
                    args={[
                        0.1,
                        16,
                    ]}
                />

                <meshStandardMaterial
                    color="#facc15"
                />
            </mesh>


            {/* ==================================================
                LEFT ARM
            ================================================== */}

            <mesh
                position={[
                    -0.48,
                    1.15,
                    0,
                ]}
                castShadow
            >
                <capsuleGeometry
                    args={[
                        0.12,
                        0.55,
                        4,
                        8,
                    ]}
                />

                <meshStandardMaterial
                    color="#2563eb"
                />
            </mesh>


            {/* ==================================================
                RIGHT ARM
            ================================================== */}

            <mesh
                position={[
                    0.48,
                    1.15,
                    0,
                ]}
                castShadow
            >
                <capsuleGeometry
                    args={[
                        0.12,
                        0.55,
                        4,
                        8,
                    ]}
                />

                <meshStandardMaterial
                    color="#2563eb"
                />
            </mesh>


            {/* ==================================================
                LEFT LEG
            ================================================== */}

            <mesh
                position={[
                    -0.18,
                    0.45,
                    0,
                ]}
                castShadow
            >
                <capsuleGeometry
                    args={[
                        0.14,
                        0.55,
                        4,
                        8,
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
                    0.18,
                    0.45,
                    0,
                ]}
                castShadow
            >
                <capsuleGeometry
                    args={[
                        0.14,
                        0.55,
                        4,
                        8,
                    ]}
                />

                <meshStandardMaterial
                    color="#111827"
                />
            </mesh>


            {/* ==================================================
                FRONT ARROW
                Very obvious direction marker
            ================================================== */}

            <mesh
                position={[
                    0,
                    1.35,
                    -0.45,
                ]}
                rotation={[
                    -Math.PI / 2,
                    0,
                    0,
                ]}
            >
                <coneGeometry
                    args={[
                        0.12,
                        0.3,
                        4,
                    ]}
                />

                <meshStandardMaterial
                    color="#facc15"
                />
            </mesh>

        </group>
    );
}
