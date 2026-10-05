"use client";

import { useRef } from "react";
import * as THREE from "three";

type Props = {
position?: [number, number, number];
rotation?: number;
};

export default function Player({
position = [0, 0, 0],
rotation = 0,
}: Props) {
const groupRef = useRef<THREE.Group>(null);


return (
    <group
        ref={groupRef}
        position={position}
        rotation={[0, rotation, 0]}
    >
        {/* Body */}
        <mesh position={[0, 1.05, 0]}>
            <capsuleGeometry args={[0.38, 0.8, 4, 8]} />
            <meshStandardMaterial color="#2563eb" />
        </mesh>

        {/* Head */}
        <mesh position={[0, 1.85, 0]}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial color="#f2c29b" />
        </mesh>

        {/* Left arm */}
        <mesh position={[-0.48, 1.15, 0]}>
            <capsuleGeometry args={[0.12, 0.55, 4, 8]} />
            <meshStandardMaterial color="#2563eb" />
        </mesh>

        {/* Right arm */}
        <mesh position={[0.48, 1.15, 0]}>
            <capsuleGeometry args={[0.12, 0.55, 4, 8]} />
            <meshStandardMaterial color="#2563eb" />
        </mesh>

        {/* Left leg */}
        <mesh position={[-0.18, 0.45, 0]}>
            <capsuleGeometry args={[0.14, 0.55, 4, 8]} />
            <meshStandardMaterial color="#111827" />
        </mesh>

        {/* Right leg */}
        <mesh position={[0.18, 0.45, 0]}>
            <capsuleGeometry args={[0.14, 0.55, 4, 8]} />
            <meshStandardMaterial color="#111827" />
        </mesh>
    </group>
);


}
