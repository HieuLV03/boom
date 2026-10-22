
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { createPortal, useFrame, useThree } from "@react-three/fiber";
import { SkeletonUtils } from "three-stdlib";
import {
    Box3,
    CylinderGeometry,
    Group,
    Mesh,
    MeshStandardMaterial,
    Quaternion,
    Vector3,
} from "three";
import type { RefObject } from "react";
import type { Object3D } from "three";
type Vec3Tuple = [number, number, number];

type ShellData = {
    id: number;
    start: Vec3Tuple;
    velocity: Vec3Tuple;
    floorY: number;
};

type Props = {
    weaponType?: string;
    modelPath?: string;
    scale?: number;
    position?: Vec3Tuple;
    rotation?: Vec3Tuple;
    leftHandGripPosition?: Vec3Tuple;
    leftHandGripTargetRef?: RefObject<Object3D | null>;
    showDebugMarkers?: boolean;
    enableFireEffects?: boolean;
};

type BulletFiredDetail = {
    weapon?: string;
};

const DEFAULT_MODEL_PATH = "/models/gun/rifle/ak47.glb";

function degreesToRadians(values: Vec3Tuple): Vec3Tuple {
    return values.map(
        (value) => (value * Math.PI) / 180,
    ) as Vec3Tuple;
}

/**
 * Vỏ đạn bay ra khỏi súng.
 * floorY hiện là độ cao sàn ước lượng, chưa nhận diện sàn từng tầng.
 */
function ShellCasing({
    casing,
    onExpire,
}: {
    casing: ShellData;
    onExpire: (id: number) => void;
}) {
    const meshRef = useRef<Mesh>(null);

    const velocityRef = useRef(
        new Vector3(...casing.velocity),
    );

    const lifeRef = useRef(0);
    const bouncedRef = useRef(false);

    useFrame((_, delta) => {
        const mesh = meshRef.current;
        if (!mesh) return;

        const dt = Math.min(delta, 0.05);
        lifeRef.current += dt;

        if (lifeRef.current >= 4) {
            onExpire(casing.id);
            return;
        }

        const velocity = velocityRef.current;

        // Trọng lực.
        velocity.y -= 9.8 * dt;

        mesh.position.x += velocity.x * dt;
        mesh.position.y += velocity.y * dt;
        mesh.position.z += velocity.z * dt;

        // Xoay vỏ đạn trong không trung.
        mesh.rotation.x += 9 * dt;
        mesh.rotation.y += 13 * dt;
        mesh.rotation.z += 7 * dt;

        // Va chạm sàn đơn giản để thử hiệu ứng.
        if (
            mesh.position.y <= casing.floorY &&
            velocity.y < 0
        ) {
            mesh.position.y = casing.floorY;

            if (!bouncedRef.current) {
                velocity.y = Math.abs(velocity.y) * 0.28;
                velocity.x *= 0.65;
                velocity.z *= 0.65;
                bouncedRef.current = true;
            } else {
                velocity.y = 0;
                velocity.x *= 0.9;
                velocity.z *= 0.9;
            }
        }
    });

    return (
        <mesh
            ref={meshRef}
            position={casing.start}
            rotation={[Math.PI / 2, 0, 0]}
            castShadow={false}
        >
            <cylinderGeometry args={[0.018, 0.018, 0.075, 8]} />
            <meshStandardMaterial
                color="#c49a45"
                metalness={0.8}
                roughness={0.28}
            />
        </mesh>
    );
}

export default function WeaponModel({
    weaponType = "rifle",
    modelPath = DEFAULT_MODEL_PATH,
    scale = 33,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    leftHandGripPosition = [0.33, 0.45, 0],
    leftHandGripTargetRef,
    showDebugMarkers = false,
    enableFireEffects = false,
}: Props) {
    const { scene: worldScene } = useThree();

    const weaponRootRef = useRef<Group>(null);
    const casingEjectRef = useRef<Group>(null);

    const recoilRef = useRef(0);
    const casingIdRef = useRef(0);

    const [casings, setCasings] = useState<ShellData[]>([]);

    const gltf = useGLTF(modelPath);

    // Clone model để tránh dùng chung object giữa các nhân vật.
    const weapon = useMemo(() => {
        const cloned = SkeletonUtils.clone(gltf.scene) as Group;

        cloned.traverse((object) => {
            const mesh = object as Mesh;

            if (mesh.isMesh) {
                mesh.castShadow = true;
                mesh.receiveShadow = true;
            }
        });

        // Đưa tâm model về gốc.
        const bounds = new Box3().setFromObject(cloned);
        const center = bounds.getCenter(new Vector3());

        cloned.position.sub(center);

        return cloned;
    }, [gltf.scene]);

    const mountRotation = useMemo(
        () => degreesToRadians(rotation),
        [rotation[0], rotation[1], rotation[2]],
    );

    const removeCasing = (id: number) => {
        setCasings((previous) =>
            previous.filter((casing) => casing.id !== id),
        );
    };

    // Nghe sự kiện bắn súng từ LocalPlayerController.
    useEffect(() => {
if (!enableFireEffects || weaponType !== "rifle") {
    return;
}
        const handleShot = (event: Event) => {
            const detail = (
                event as CustomEvent<BulletFiredDetail>
            ).detail;

            // Nếu sự kiện có chỉ rõ loại súng, chỉ nhận sự kiện rifle.
            if (
                detail?.weapon &&
                detail.weapon !== "rifle"
            ) {
                return;
            }

            // Tạo độ giật ngắn khi bắn liên tục.
            recoilRef.current = Math.min(
                recoilRef.current + 0.7,
                1.5,
            );

            const ejectPoint = casingEjectRef.current;
            if (!ejectPoint) return;

            ejectPoint.updateWorldMatrix(true, false);

            const worldPosition = new Vector3();
            const worldQuaternion = new Quaternion();

            ejectPoint.getWorldPosition(worldPosition);
            ejectPoint.getWorldQuaternion(worldQuaternion);

            // Hất vỏ đạn sang bên và hơi chếch lên.
            const velocity = new Vector3(1.8, 2.2, -0.8)
                .applyQuaternion(worldQuaternion);

            const id = ++casingIdRef.current;

            const casing: ShellData = {
                id,
                start: [
                    worldPosition.x,
                    worldPosition.y,
                    worldPosition.z,
                ],
                velocity: [
                    velocity.x,
                    velocity.y,
                    velocity.z,
                ],

                // Giá trị tạm để kiểm tra hiệu ứng trên một tầng.
                floorY: worldPosition.y - 1.3,
            };

            setCasings((previous) => [
                ...previous.slice(-19),
                casing,
            ]);
        };

        window.addEventListener(
            "boom:bullet-fired",
            handleShot,
        );

        return () => {
            window.removeEventListener(
                "boom:bullet-fired",
                handleShot,
            );
        };
}, [weaponType, enableFireEffects]);
    // Làm độ giật giảm dần về 0.
  useFrame((_, delta) => {
    const root = weaponRootRef.current;
    if (!root) return;

    if (!enableFireEffects) {
        recoilRef.current = 0;
        root.position.x = 0;
        root.rotation.z = 0;
        return;
    }

    const recoil = recoilRef.current;

    recoilRef.current = Math.max(
        0,
        recoil - delta * 7,
    );

    root.position.x = -recoil * 0.025;
    root.rotation.z = recoil * 0.035;
});
    return (
        <>
            <group
                position={position}
                rotation={mountRotation}
                scale={scale}
            >
                {/* Nhóm này chỉ điều khiển hình súng và hiệu ứng giật. */}
                <group ref={weaponRootRef}>
                    <primitive object={weapon} />

                    {/* Điểm thoát vỏ đạn, đặt gần khe nhả vỏ của súng. */}
                    <group
                        ref={casingEjectRef}
                        position={[0.18, 0.36, 0.08]}
                    >
                        {showDebugMarkers && (
                            <mesh>
                                <sphereGeometry args={[0.025, 8, 8]} />
                                <meshBasicMaterial color="orange" />
                            </mesh>
                        )}
                    </group>
                </group>

                {/* Giữ điểm IK ổn định, không làm nó rung theo độ giật. */}
              <object3D
    ref={leftHandGripTargetRef}
    name="LeftHandGripTarget"
    position={leftHandGripPosition}
/>

                {showDebugMarkers && (
                    <mesh position={leftHandGripPosition}>
                        <sphereGeometry args={[0.025, 8, 8]} />
                        <meshBasicMaterial color="lime" />
                    </mesh>
                )}
            </group>

            {/* Vỏ đạn được tạo ở scene chính theo tọa độ thế giới. */}
            {createPortal(
                <>
                    {casings.map((casing) => (
                        <ShellCasing
                            key={casing.id}
                            casing={casing}
                            onExpire={removeCasing}
                        />
                    ))}
                </>,
                worldScene,
            )}
        </>
    );
}

useGLTF.preload(DEFAULT_MODEL_PATH);
