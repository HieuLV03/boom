
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

    clone.updateMatrixWorld(true);

    const bounds = new Box3().setFromObject(clone);
    const size = new Vector3();
    const center = new Vector3();

    bounds.getSize(size);
    bounds.getCenter(center);

    if (bounds.isEmpty()) {
        console.error(
            "[WeaponModel] Model không có hình học:",
            modelPath,
        );

        return clone;
    }

    // Căn giữa ngang, nhưng đặt đáy model tại Y = 0.
    clone.position.x -= center.x;
    clone.position.y -= bounds.min.y;
    clone.position.z -= center.z;

    clone.traverse((object) => {
        const mesh = object as any;

        if (mesh.isMesh) {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
        }
    });

    console.log("[WeaponModel] Đã căn chỉnh model:", {
        weaponType,
        modelPath,
        size: {
            x: size.x,
            y: size.y,
            z: size.z,
        },
        originalBottomY: bounds.min.y,
        originalCenter: {
            x: center.x,
            y: center.y,
            z: center.z,
        },
    });

    return clone;
}, [scene, modelPath, weaponType]);
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
