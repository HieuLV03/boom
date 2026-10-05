
"use client";

import { useEffect, useState } from "react";

import { Html } from "@react-three/drei";

type Props = {
    position: [number, number, number];

    remaining: number;

    exploded: boolean;
};

export default function Bomb({
    position,
    remaining,
    exploded,
}: Props) {
    const [pulse, setPulse] =
        useState(false);

    useEffect(() => {
        if (exploded) {
            return;
        }

        setPulse(true);

        const timer =
            window.setTimeout(() => {
                setPulse(false);
            }, 120);

        return () => {
            window.clearTimeout(timer);
        };
    }, [remaining, exploded]);

    if (exploded) {
        return (
            <group position={position}>
                {/* ======================================
                    OUTER EXPLOSION
                ====================================== */}

                <mesh
                    position={[
                        0,
                        0.15,
                        0,
                    ]}
                >
                    <sphereGeometry
                        args={[
                            1.8,
                            20,
                            20,
                        ]}
                    />

                    <meshBasicMaterial
                        color="#ff6b00"
                        transparent
                        opacity={0.65}
                    />
                </mesh>

                {/* ======================================
                    INNER EXPLOSION
                ====================================== */}

                <mesh
                    position={[
                        0,
                        0.2,
                        0,
                    ]}
                >
                    <sphereGeometry
                        args={[
                            1.15,
                            16,
                            16,
                        ]}
                    />

                    <meshBasicMaterial
                        color="#ffd43b"
                        transparent
                        opacity={0.85}
                    />
                </mesh>

                {/* ======================================
                    FIRE CORE
                ====================================== */}

                <mesh
                    position={[
                        0,
                        0.25,
                        0,
                    ]}
                >
                    <sphereGeometry
                        args={[
                            0.55,
                            12,
                            12,
                        ]}
                    />

                    <meshBasicMaterial
                        color="#fff4b3"
                    />
                </mesh>
            </group>
        );
    }

    return (
        <group position={position}>
            {/* ======================================
                BOMB BODY
            ====================================== */}

            <mesh
                position={[
                    0,
                    0.45,
                    0,
                ]}
                scale={
                    pulse
                        ? 1.12
                        : 1
                }
                castShadow
            >
                <sphereGeometry
                    args={[
                        0.35,
                        20,
                        20,
                    ]}
                />

                <meshStandardMaterial
                    color="#171717"
                    roughness={0.55}
                />
            </mesh>

            {/* ======================================
                BOMB CAP
            ====================================== */}

            <mesh
                position={[
                    0,
                    0.78,
                    0,
                ]}
                castShadow
            >
                <cylinderGeometry
                    args={[
                        0.09,
                        0.09,
                        0.18,
                        10,
                    ]}
                />

                <meshStandardMaterial
                    color="#3f3f46"
                />
            </mesh>

            {/* ======================================
                FUSE
            ====================================== */}

            <mesh
                position={[
                    0,
                    0.9,
                    0,
                ]}
            >
                <sphereGeometry
                    args={[
                        0.06,
                        10,
                        10,
                    ]}
                />

                <meshStandardMaterial
                    color="#ff5c5c"
                    emissive="#ff0000"
                    emissiveIntensity={
                        pulse
                            ? 3
                            : 1
                    }
                />
            </mesh>

            {/* ======================================
                COUNTDOWN
            ====================================== */}

            <Html
                position={[
                    0,
                    1.55,
                    0,
                ]}
                center
                distanceFactor={8}
            >
                <div
                    style={{
                        minWidth: 42,
                        height: 42,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "50%",
                        background:
                            "rgba(0,0,0,.72)",
                        border:
                            "2px solid rgba(255,255,255,.4)",
                        color: "#fff",
                        fontSize: 22,
                        fontWeight: 900,
                        fontFamily:
                            "Arial, sans-serif",
                        boxShadow:
                            "0 4px 15px rgba(0,0,0,.4)",
                        userSelect: "none",
                        pointerEvents: "none",
                    }}
                >
                    {remaining}
                </div>
            </Html>
        </group>
    );
}
