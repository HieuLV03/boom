
"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import {
    Billboard,
    Box,
    Float,
    Sparkles,
    Text,
} from "@react-three/drei";
import type { Mesh } from "three";
import { useScareObjectStore } from "@/stores/scareObject.store";

const MAX_HP = 100;
const HIT_FLASH_DURATION = 150;

export default function ScareObject() {
    const cubeRef = useRef<Mesh>(null);
    const hitTimeoutRef = useRef<number | null>(null);

    const hp = useScareObjectStore((state) => state.hp);
    const isHit = useScareObjectStore((state) => state.isHit);

    useEffect(() => {
        return () => {
            if (hitTimeoutRef.current !== null) {
                window.clearTimeout(hitTimeoutRef.current);
            }
        };
    }, []);

    const hpPercent = Math.max(0, Math.min(1, hp / MAX_HP));

    const hpColor =
        hpPercent > 0.5
            ? "#39ff14"
            : hpPercent > 0.25
              ? "#ffcc00"
              : "#ff2020";

    useFrame((state, delta) => {
        if (!cubeRef.current) return;

        cubeRef.current.rotation.y += delta * 0.7;
        cubeRef.current.rotation.x += delta * 0.25;

        const material = cubeRef.current.material;

        if (
            !Array.isArray(material) &&
            "emissiveIntensity" in material
        ) {
            material.emissiveIntensity = isHit
                ? 3
                : 1.2 +
                  Math.sin(state.clock.elapsedTime * 3) * 0.45;
        }
    });

    if (hp <= 0) return null;

    return (
        <group position={[0, 1.2, 0]}>
            <Float
                speed={2}
                rotationIntensity={0.15}
                floatIntensity={0.35}
            >
                <Box
                    ref={cubeRef}
                    args={[1.2, 1.2, 1.2]}
                    castShadow
                    receiveShadow
                >
                    <meshStandardMaterial
                        color={isHit ? "#ffff00" : "#360808"}
                        emissive={isHit ? "#ffff00" : "#ff0808"}
                        emissiveIntensity={isHit ? 3 : 1.2}
                        roughness={0.25}
                        metalness={0.45}
                    />
                </Box>

                <Sparkles
                    position={[0, 0.8, 0]}
                    count={24}
                    scale={1.5}
                    size={3}
                    speed={0.6}
                    color={isHit ? "#ffff00" : "#ff2525"}
                />

                <pointLight
                    position={[0, 0.5, 0]}
                    color={isHit ? "#ffff00" : "#ff1010"}
                    intensity={isHit ? 7 : 4}
                    distance={5}
                />
            </Float>

            <Billboard position={[0, 1.45, 0]}>
                <Text
                    position={[0, 0.35, 0]}
                    fontSize={0.2}
                    color={isHit ? "#ffff00" : "#ff3333"}
                    outlineWidth={0.025}
                    outlineColor="#000000"
                    anchorX="center"
                    anchorY="middle"
                >
                    SHOOT HERE!
                </Text>

                <Text
                    position={[0, 0.08, 0]}
                    fontSize={0.13}
                    color="white"
                    outlineWidth={0.015}
                    outlineColor="#000000"
                    anchorX="center"
                    anchorY="middle"
                >
                    {`${hp} / ${MAX_HP} HP`}
                </Text>

                <mesh position={[0, -0.12, 0]}>
                    <planeGeometry args={[1.5, 0.16]} />
                    <meshBasicMaterial
                        color="#222222"
                        depthTest={false}
                    />
                </mesh>

                {hpPercent > 0 && (
                    <mesh
                        position={[
                            -0.75 + (1.5 * hpPercent) / 2,
                            -0.12,
                            0.01,
                        ]}
                    >
                        <planeGeometry
                            args={[1.5 * hpPercent, 0.12]}
                        />
                        <meshBasicMaterial
                            color={hpColor}
                            depthTest={false}
                        />
                    </mesh>
                )}
            </Billboard>
        </group>
    );
}
