
"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Box, Float, Sparkles } from "@react-three/drei";
import type { Mesh } from "three";

export default function ScareObject() {
    const cubeRef = useRef<Mesh>(null);

    useFrame((state, delta) => {
        if (!cubeRef.current) return;

        cubeRef.current.rotation.y += delta * 0.7;
        cubeRef.current.rotation.x += delta * 0.25;

        // Khối lập phương phát sáng nhẹ theo thời gian.
        const material = cubeRef.current.material;

        if ("emissiveIntensity" in material) {
            const pulse =
                1.2 + Math.sin(state.clock.elapsedTime * 3) * 0.45;

            material.emissiveIntensity = pulse;
        }
    });

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
                        color="#360808"
                        emissive="#ff0808"
                        emissiveIntensity={1.2}
                        roughness={0.25}
                        metalness={0.45}
                    />
                </Box>
            </Float>

            <Sparkles
                count={24}
                scale={2.4}
                size={3}
                speed={0.6}
                color="#ff2525"
            />

            <pointLight
                color="#ff1010"
                intensity={4}
                distance={5}
            />
        </group>
    );
}
