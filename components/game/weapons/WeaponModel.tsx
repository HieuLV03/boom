
"use client";

import { useMemo } from "react";
import type { RefObject } from "react";
import { useGLTF } from "@react-three/drei";
import { SkeletonUtils } from "three-stdlib";
import {
    Box3,
    Group,
    Mesh,
    Object3D,
    Vector3,
} from "three";
type Props = {
    weaponType?: string;
    modelPath?: string;
    scale?: number;
    position?: [number, number, number];
    rotation?: [number, number, number];

    // Điểm mục tiêu để tay trái nắm phần trước khẩu súng.
    // Tọa độ local, trước khi áp dụng scale của model.
    leftHandGripPosition?: [number, number, number];

    showDebugMarkers?: boolean;
    leftHandGripTargetRef?: RefObject<Object3D | null>;
};

export default function WeaponModel({
    weaponType = "rifle",
    modelPath = "/models/gun/rifle/ak47.glb",
    scale = 1,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
leftHandGripPosition = [0.33, 0.45, 0],
    showDebugMarkers = false,
        leftHandGripTargetRef,

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

        // Giữ nguyên cách căn model hiện tại.
        clone.position.x -= center.x;
        clone.position.y -= bounds.min.y;
        clone.position.z -= center.z;

        clone.traverse((object) => {
            if ((object as Mesh).isMesh) {
                object.castShadow = true;
                object.receiveShadow = true;
            }
        });

        console.log("[WeaponModel] Dimensions:", {
            modelPath,
            size: {
                x: Number(size.x.toFixed(4)),
                y: Number(size.y.toFixed(4)),
                z: Number(size.z.toFixed(4)),
            },
            displayScale: scale,
        });

        return clone;
    }, [scene, modelPath, scale]);

    return (
        <group
            name={`Weapon_${weaponType}`}
            position={position}
            rotation={rotation}
            scale={scale}
        >
            <primitive object={weapon} />

            {weaponType === "rifle" && (
                <>
                    {/* Mục tiêu để tay trái tìm đến.
                        Giữ object này để Character3D truy cập. */}
                 <object3D
    ref={leftHandGripTargetRef}
    name="LeftHandGripTarget"
    position={leftHandGripPosition}
/>

                    {showDebugMarkers && (
                        <>
                            <mesh
                                name="RifleStockMarker"
                                position={[0.40, 0.40, 0]}
                            >
                                <sphereGeometry args={[0.008, 12, 12]} />
                                <meshBasicMaterial
                                    color="red"
                                    depthTest={false}
                                />
                            </mesh>

                            <mesh
                                name="RifleTriggerMarker"
                                position={[-0.20, 0.31, 0]}
                            >
                                <sphereGeometry args={[0.008, 12, 12]} />
                                <meshBasicMaterial
                                    color="#00ffff"
                                    depthTest={false}
                                />
                            </mesh>

                      <mesh
    name="LeftHandGripDebugMarker"
    position={leftHandGripPosition}
    renderOrder={999}
>
    <sphereGeometry args={[0.06, 12, 12]} />
    <meshBasicMaterial
        color="#ff8800"
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
    />
</mesh>
                        </>
                    )}
                </>
            )}
        </group>
    );
}

useGLTF.preload("/models/gun/rifle/ak47.glb");
