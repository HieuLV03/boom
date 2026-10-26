
"use client";

import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { useGLTF } from "@react-three/drei";
import {
    createPortal,
    useFrame,
    useThree,
} from "@react-three/fiber";
import { SkeletonUtils } from "three-stdlib";
import {
    Box3,
    Group,
    Mesh,
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

        velocity.y -= 9.8 * dt;

        mesh.position.x += velocity.x * dt;
        mesh.position.y += velocity.y * dt;
        mesh.position.z += velocity.z * dt;

        mesh.rotation.x += 9 * dt;
        mesh.rotation.y += 13 * dt;
        mesh.rotation.z += 7 * dt;

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

    // Clone riêng model súng cho instance này.
    const weapon = useMemo(() => {
        const cloned = SkeletonUtils.clone(gltf.scene) as Group;

        cloned.traverse((object) => {
            const mesh = object as Mesh;

            if (mesh.isMesh) {
                mesh.castShadow = true;
                mesh.receiveShadow = true;
            }
        });

        // Giữ nguyên cách căn tâm model hiện tại.
        const bounds = new Box3().setFromObject(cloned);
        const center = bounds.getCenter(new Vector3());

        cloned.position.sub(center);

        return cloned;
    }, [gltf.scene]);

   
    // Marker này chỉ được tìm bên trong GLB súng đã clone.
    const leftHandGripMarker = useMemo(() => {
        const marker = weapon.getObjectByName("LeftHandGrip");

        if (!marker) {
            console.error(
                '[WeaponModel] Không tìm thấy "LeftHandGrip" trong GLB súng:',
                modelPath,
            );
        }

        return marker ?? null;
    }, [weapon, modelPath]);


    // Đăng ký marker để IK tay trái sử dụng.
    useEffect(() => {
        if (!leftHandGripTargetRef) return;

        if (!leftHandGripMarker) {
            leftHandGripTargetRef.current = null;

            const markerNames: string[] = [];

            weapon.traverse((object) => {
                if (
                    object.name &&
                    /grip|hand|left/i.test(object.name)
                ) {
                    markerNames.push(object.name);
                }
            });

            console.error(
                '[WeaponModel] Không tìm thấy marker "LeftHandGrip".',
                {
                    modelPath,
                    matchingNames: markerNames,
                },
            );

            return;
        }

        leftHandGripTargetRef.current = leftHandGripMarker;

        console.info(
            '[WeaponModel] Đã đăng ký marker "LeftHandGrip".',
            {
                name: leftHandGripMarker.name,
                parent: leftHandGripMarker.parent?.name,
                modelPath,
            },
        );

        return () => {
            if (
                leftHandGripTargetRef.current ===
                leftHandGripMarker
            ) {
                leftHandGripTargetRef.current = null;
            }
        };
    }, [
        leftHandGripMarker,
        leftHandGripTargetRef,
        modelPath,
        weapon,
    ]);

    const mountRotation = useMemo(
        () => degreesToRadians(rotation),
        [rotation[0], rotation[1], rotation[2]],
    );

    const removeCasing = (id: number) => {
        setCasings((previous) =>
            previous.filter((casing) => casing.id !== id),
        );
    };

    // Lắng nghe sự kiện bắn súng.
    useEffect(() => {
        if (
            !enableFireEffects ||
            weaponType !== "rifle"
        ) {
            return;
        }

        const handleShot = (event: Event) => {
            const detail = (
                event as CustomEvent<BulletFiredDetail>
            ).detail;

            if (
                detail?.weapon &&
                detail.weapon !== "rifle"
            ) {
                return;
            }

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

    // Giảm recoil theo thời gian.

  useFrame((_, delta) => {
    const root = weaponRootRef.current;
    if (!root) return;

    if (!enableFireEffects) {
        recoilRef.current = 0;
        root.position.x = 0;
        root.rotation.z = 0;
        return;
    }

    recoilRef.current = Math.max(
        0,
        recoilRef.current - delta * 7,
    );

    const recoil = recoilRef.current;
    const safeScale = Math.max(Math.abs(scale), 0.001);

    // Giới hạn độ giật theo tọa độ world, tránh súng
    // dịch chuyển quá xa khi model có scale lớn.
    root.position.x = -(recoil * 0.05) / safeScale;

    // Giảm độ xoay để điểm grip ít lệch khỏi bàn tay.
    root.rotation.z = recoil * 0.012;
});
    return (
        <>
            <group
                position={position}
                rotation={mountRotation}
                scale={scale}
            >
                <group ref={weaponRootRef}>
                    <primitive object={weapon} />
                    {/* Điểm thoát vỏ đạn. */}
                    <group
                        ref={casingEjectRef}
                        position={[0.18, 0.36, 0.08]}
                    >
                        {showDebugMarkers && (
                            <mesh>
                                <sphereGeometry
                                    args={[0.025, 8, 8]}
                                />
                                <meshBasicMaterial color="orange" />
                            </mesh>
                        )}
                    </group>
                </group>
                {/* Hiển thị vị trí world của marker grip thật. */}
                {showDebugMarkers && leftHandGripMarker && (
                    <GripDebugMarker marker={leftHandGripMarker} />
                )}
            </group>

            {/* Vỏ đạn nằm trong scene chính theo world coordinates. */}
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

/**
 * Hiện chấm xanh tại world position của marker thật.
 * Không thay đổi transform của marker hoặc model súng.
 */
function GripDebugMarker({
    marker,
}: {
    marker: Object3D;
}) {
    const debugRef = useRef<Mesh>(null);
    const worldPosition = useMemo(() => new Vector3(), []);

    useFrame(() => {
        const debug = debugRef.current;
        if (!debug) return;

        marker.updateWorldMatrix(true, false);
        marker.getWorldPosition(worldPosition);

        // Chấm debug nằm ngoài hierarchy của súng,
        // vì vậy dùng world position trực tiếp.
        debug.position.copy(worldPosition);
    });

    return (
        <mesh ref={debugRef} renderOrder={999}>
            <sphereGeometry args={[0.025, 10, 10]} />
            <meshBasicMaterial
                color="lime"
                depthTest={false}
                depthWrite={false}
            />
        </mesh>
    );
}

useGLTF.preload(DEFAULT_MODEL_PATH);
