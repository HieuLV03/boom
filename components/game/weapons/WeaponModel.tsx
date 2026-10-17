
"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { SkeletonUtils } from "three-stdlib";
import {
    Box3,
    Group,
    Vector3,
} from "three";

type Props = {
    weaponType?: string;
    modelPath?: string;
    scale?: number;
    position?: [number, number, number];
    rotation?: [number, number, number];
};

export default function WeaponModel({
    weaponType = "rifle",
    modelPath = "/models/gun/rifle/ak47.glb",
    scale = 1,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
}: Props) {
    const { scene } = useGLTF(modelPath);

    const weapon = useMemo(() => {
        const clone = SkeletonUtils.clone(scene) as Group;

        // Tính kích thước model.
        clone.updateMatrixWorld(true);

        const bounds = new Box3().setFromObject(clone);
        const size = new Vector3();
        const center = new Vector3();

        bounds.getSize(size);
        bounds.getCenter(center);

        console.log("[WeaponModel] GLB:", {
            modelPath,
            size: {
                x: size.x,
                y: size.y,
                z: size.z,
            },
            center: {
                x: center.x,
                y: center.y,
                z: center.z,
            },
        });

        // Đưa tâm hình học về gần gốc tọa độ.
        clone.position.sub(center);

        return clone;
    }, [scene, modelPath]);

    return (
        <group
            name={`Weapon_${weaponType}`}
            position={position}
            rotation={rotation}
            scale={scale}
        >
            <primitive object={weapon} />
        </group>
    );
}

useGLTF.preload("/models/gun/rifle/ak47.glb");
