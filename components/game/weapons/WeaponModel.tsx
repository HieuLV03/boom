"use client";

import { useMemo } from "react";
import {
    BoxGeometry,
    CylinderGeometry,
    MeshStandardMaterial,
} from "three";

type Props = {
    weaponType?: string;
};

export default function WeaponModel({
    weaponType = "rifle",
}: Props) {
    const materials = useMemo(() => ({
        body: new MeshStandardMaterial({
            color: "#30343b",
            roughness: 0.7,
            metalness: 0.35,
        }),
        dark: new MeshStandardMaterial({
            color: "#15171b",
            roughness: 0.85,
        }),
        metal: new MeshStandardMaterial({
            color: "#858b94",
            roughness: 0.35,
            metalness: 0.8,
        }),
    }), []);

    return (
        <group>
            {/* Thân súng */}
            <mesh
                position={[0, 0, 0]}
                material={materials.body}
                castShadow
            >
                <boxGeometry args={[0.32, 0.42, 2.8]} />
            </mesh>

            {/* Nòng súng */}
            <mesh
                position={[0, 0.02, -1.85]}
                rotation={[Math.PI / 2, 0, 0]}
                material={materials.metal}
                castShadow
            >
                <cylinderGeometry args={[0.07, 0.07, 1.25, 10]} />
            </mesh>

            {/* Báng súng */}
            <mesh
                position={[0, -0.25, 1.55]}
                rotation={[0.25, 0, 0]}
                material={materials.dark}
                castShadow
            >
                <boxGeometry args={[0.24, 0.32, 0.95]} />
            </mesh>

            {/* Tay cầm */}
            <mesh
                position={[0, -0.35, 0.45]}
                rotation={[0.2, 0, 0]}
                material={materials.dark}
                castShadow
            >
                <boxGeometry args={[0.19, 0.48, 0.28]} />
            </mesh>

            {/* Hộp tiếp đạn */}
            <mesh
                position={[0, -0.35, -0.15]}
                rotation={[0.12, 0, 0]}
                material={materials.dark}
                castShadow
            >
                <boxGeometry args={[0.22, 0.52, 0.4]} />
            </mesh>

            {/* Đầu ngắm */}
            <mesh
                position={[0, 0.25, -0.2]}
                material={materials.dark}
                castShadow
            >
                <boxGeometry args={[0.12, 0.12, 0.42]} />
            </mesh>
        </group>
    );
}