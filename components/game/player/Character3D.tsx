
"use client";

import {
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
} from "react";

import {
    useFrame,
} from "@react-three/fiber";

import {
    useAnimations,
    useGLTF,
} from "@react-three/drei";

import {
    SkeletonUtils,
} from "three-stdlib";

import {
    Box3,
    Group,
    CapsuleGeometry,
    Color,
    LoopRepeat,
    Mesh,
    MeshStandardMaterial,
    SphereGeometry,
    Vector3,
} from "three";

import type {
    Bone,
    Object3D,
} from "three";

import WeaponModel from "../weapons/WeaponModel";

// ============================================================
// CONFIG
// ============================================================

const MODEL_PATH = "/models/character/character.glb";
const MODEL_SCALE = 0.015;

// Súng được phóng to so với cấu hình cũ.
// Nếu súng quá to, giảm xuống 5 hoặc 6.
const WEAPON_SCALE = 8;

// Offset tính theo hệ tọa độ local của xương bàn tay.
// Điều chỉnh các giá trị này nếu súng lệch khỏi bàn tay.
const WEAPON_POSITION: [number, number, number] = [
    0,
    0,
    0,
];

const WEAPON_ROTATION: [number, number, number] = [
    0,
    0,
    0,
];

const COLORS = {
    hoodie: "#202633",
    sleeves: "#30394A",
    pants: "#292D35",
    shoes: "#E7E8EC",
    sole: "#777D87",
    hood: "#252D3B",
};

// ============================================================
// TYPES
// ============================================================

type Props = {
    moving?: boolean;
    weaponType?: string;
};

type SegmentProps = {
    root: Object3D;
    start: Bone | null;
    end: Bone | null;
    material: MeshStandardMaterial;
    radius: number;
    depthRatio?: number;
};

type AccessoryProps = {
    root: Object3D;
    bone: Bone | null;
    material: MeshStandardMaterial;
    scale: [number, number, number];
    offset?: [number, number, number];
};

// ============================================================
// BONE HELPERS
// ============================================================

function normalizeName(name: string) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
}

function findBone(
    root: Object3D,
    candidates: string[],
): Bone | null {
    const bones: Bone[] = [];

    root.traverse((object) => {
        if ((object as Bone).isBone) {
            bones.push(object as Bone);
        }
    });

    const names = candidates.map(normalizeName);

    for (const name of names) {
        const found = bones.find(
            (bone) => normalizeName(bone.name) === name,
        );

        if (found) {
            return found;
        }
    }

    for (const name of names) {
        const found = bones.find(
            (bone) => normalizeName(bone.name).endsWith(name),
        );

        if (found) {
            return found;
        }
    }

    return null;
}

// ============================================================
// CLOTHING SEGMENT
// ============================================================

function ClothingSegment({
    root,
    start,
    end,
    material,
    radius,
    depthRatio = 0.85,
}: SegmentProps) {
    const meshRef = useRef<Mesh>(null);

    const geometry = useMemo(
        () => new CapsuleGeometry(1, 1, 4, 12),
        [],
    );

    const startPosition = useMemo(
        () => new Vector3(),
        [],
    );

    const endPosition = useMemo(
        () => new Vector3(),
        [],
    );

    const direction = useMemo(
        () => new Vector3(),
        [],
    );

    const midpoint = useMemo(
        () => new Vector3(),
        [],
    );

    const up = useMemo(
        () => new Vector3(0, 1, 0),
        [],
    );

    useFrame(() => {
        const mesh = meshRef.current;

        if (!mesh || !start || !end) {
            return;
        }

        root.updateMatrixWorld(true);

        start.getWorldPosition(startPosition);
        end.getWorldPosition(endPosition);

        root.worldToLocal(startPosition);
        root.worldToLocal(endPosition);

        direction.subVectors(
            endPosition,
            startPosition,
        );

        const length = direction.length();

        if (length < 0.0000001) {
            mesh.visible = false;
            return;
        }

        mesh.visible = true;

        midpoint
            .addVectors(startPosition, endPosition)
            .multiplyScalar(0.5);

        mesh.position.copy(midpoint);

        direction.normalize();

        mesh.quaternion.setFromUnitVectors(
            up,
            direction,
        );

        mesh.scale.set(
            radius,
            length / 3,
            radius * depthRatio,
        );
    });

    useEffect(() => {
        return () => {
            geometry.dispose();
        };
    }, [geometry]);

    if (!start || !end) {
        return null;
    }

    return (
        <mesh
            ref={meshRef}
            geometry={geometry}
            material={material}
            castShadow
            receiveShadow
        />
    );
}

// ============================================================
// CLOTHING ACCESSORY
// ============================================================

function ClothingAccessory({
    root,
    bone,
    material,
    scale,
    offset = [0, 0, 0],
}: AccessoryProps) {
    const meshRef = useRef<Mesh>(null);

    const position = useMemo(
        () => new Vector3(),
        [],
    );

    const localOffset = useMemo(
        () => new Vector3(...offset),
        [offset],
    );

    const geometry = useMemo(
        () => new SphereGeometry(1, 20, 14),
        [],
    );

    useFrame(() => {
        const mesh = meshRef.current;

        if (!mesh || !bone) {
            return;
        }

        root.updateMatrixWorld(true);

        bone.getWorldPosition(position);
        root.worldToLocal(position);

        mesh.position
            .copy(position)
            .add(localOffset);
    });

    useEffect(() => {
        return () => {
            geometry.dispose();
        };
    }, [geometry]);

    if (!bone) {
        return null;
    }

    return (
        <mesh
            ref={meshRef}
            geometry={geometry}
            material={material}
            scale={scale}
            castShadow
            receiveShadow
        />
    );
}

// ============================================================
// CLOTHING
// ============================================================

function CharacterClothing({
    root,
}: {
    root: Object3D;
}) {
    const dimensions = useMemo(() => {
        root.updateMatrixWorld(true);

        const bounds = new Box3().setFromObject(root);
        const size = new Vector3();

        bounds.getSize(size);

        const height = Math.max(size.y, 1);

        return {
            height,
            torsoRadius: height * 0.075,
            armRadius: height * 0.027,
            thighRadius: height * 0.04,
            legRadius: height * 0.029,
            shoeWidth: height * 0.07,
            shoeHeight: height * 0.035,
            shoeLength: height * 0.105,
            hoodRadius: height * 0.055,
        };
    }, [root]);

    const bones = useMemo(() => ({
        hips: findBone(root, ["Hips", "Pelvis"]),
        neck: findBone(root, ["Neck"]),

        leftArm: findBone(root, ["LeftArm"]),
        leftForeArm: findBone(
            root,
            ["LeftForeArm", "LeftForearm"],
        ),

        rightArm: findBone(root, ["RightArm"]),
        rightForeArm: findBone(
            root,
            ["RightForeArm", "RightForearm"],
        ),

        leftUpLeg: findBone(root, ["LeftUpLeg"]),
        leftLeg: findBone(root, ["LeftLeg"]),
        leftFoot: findBone(root, ["LeftFoot"]),

        rightUpLeg: findBone(root, ["RightUpLeg"]),
        rightLeg: findBone(root, ["RightLeg"]),
        rightFoot: findBone(root, ["RightFoot"]),
    }), [root]);

    const materials = useMemo(() => ({
        hoodie: new MeshStandardMaterial({
            color: new Color(COLORS.hoodie),
            roughness: 0.95,
        }),

        sleeves: new MeshStandardMaterial({
            color: new Color(COLORS.sleeves),
            roughness: 0.9,
        }),

        pants: new MeshStandardMaterial({
            color: new Color(COLORS.pants),
            roughness: 0.95,
        }),

        shoes: new MeshStandardMaterial({
            color: new Color(COLORS.shoes),
            roughness: 0.8,
        }),

        sole: new MeshStandardMaterial({
            color: new Color(COLORS.sole),
            roughness: 0.9,
        }),

        hood: new MeshStandardMaterial({
            color: new Color(COLORS.hood),
            roughness: 0.95,
        }),
    }), []);

    useEffect(() => {
        console.log(
            "[Character3D] Model dimensions:",
            dimensions,
        );

        console.table(
            Object.entries(bones).map(([part, bone]) => ({
                part,
                bone: bone?.name ?? "NOT FOUND",
            })),
        );

        return () => {
            Object.values(materials).forEach(
                (material) => material.dispose(),
            );
        };
    }, [bones, dimensions, materials]);

    const d = dimensions;

    return (
        <group>
            <ClothingSegment
                root={root}
                start={bones.hips}
                end={bones.neck}
                material={materials.hoodie}
                radius={d.torsoRadius}
                depthRatio={0.75}
            />

            <ClothingSegment
                root={root}
                start={bones.leftArm}
                end={bones.leftForeArm}
                material={materials.sleeves}
                radius={d.armRadius}
            />

            <ClothingSegment
                root={root}
                start={bones.rightArm}
                end={bones.rightForeArm}
                material={materials.sleeves}
                radius={d.armRadius}
            />

            <ClothingSegment
                root={root}
                start={bones.hips}
                end={bones.leftLeg}
                material={materials.pants}
                radius={d.thighRadius}
            />

            <ClothingSegment
                root={root}
                start={bones.hips}
                end={bones.rightLeg}
                material={materials.pants}
                radius={d.thighRadius}
            />

            <ClothingSegment
                root={root}
                start={bones.leftLeg}
                end={bones.leftFoot}
                material={materials.pants}
                radius={d.legRadius}
            />

            <ClothingSegment
                root={root}
                start={bones.rightLeg}
                end={bones.rightFoot}
                material={materials.pants}
                radius={d.legRadius}
            />

            <ClothingAccessory
                root={root}
                bone={bones.leftFoot}
                material={materials.shoes}
                scale={[
                    d.shoeWidth,
                    d.shoeHeight,
                    d.shoeLength,
                ]}
            />

            <ClothingAccessory
                root={root}
                bone={bones.rightFoot}
                material={materials.shoes}
                scale={[
                    d.shoeWidth,
                    d.shoeHeight,
                    d.shoeLength,
                ]}
            />

            <ClothingAccessory
                root={root}
                bone={bones.leftFoot}
                material={materials.sole}
                scale={[
                    d.shoeWidth * 1.04,
                    d.shoeHeight * 0.35,
                    d.shoeLength * 1.04,
                ]}
                offset={[
                    0,
                    -d.shoeHeight * 0.7,
                    0,
                ]}
            />

            <ClothingAccessory
                root={root}
                bone={bones.rightFoot}
                material={materials.sole}
                scale={[
                    d.shoeWidth * 1.04,
                    d.shoeHeight * 0.35,
                    d.shoeLength * 1.04,
                ]}
                offset={[
                    0,
                    -d.shoeHeight * 0.7,
                    0,
                ]}
            />

            <ClothingAccessory
                root={root}
                bone={bones.neck}
                material={materials.hood}
                scale={[
                    d.hoodRadius,
                    d.hoodRadius,
                    d.hoodRadius * 0.8,
                ]}
                offset={[
                    0,
                    d.hoodRadius * 0.2,
                    -d.hoodRadius * 0.5,
                ]}
            />
        </group>
    );
}

// ============================================================
// HELD WEAPON
// ============================================================

function HeldWeapon({
    root,
    weaponType,
}: {
    root: Object3D;
    weaponType: string;
}) {
    const mountRef = useRef<Group>(null);

    const normalizedWeaponType = weaponType
        .trim()
        .toLowerCase();

    const hand = useMemo(
        () =>
            findBone(root, [
                "RightHand",
                "mixamorig:RightHand",
                "mixamorigRightHand",
            ]),
        [root],
    );

    useLayoutEffect(() => {
        const mount = mountRef.current;

        if (!mount || !hand) {
            console.warn("[HELD WEAPON] Cannot mount weapon", {
                hand: hand?.name ?? "NOT FOUND",
                weaponType: normalizedWeaponType,
            });

            return;
        }

        // Gắn mount vào bàn tay phải.
        // Khi đổi vũ khí hoặc unmount, cleanup sẽ gỡ mount.
        hand.add(mount);

        mount.position.set(...WEAPON_POSITION);
        mount.rotation.set(...WEAPON_ROTATION);
        mount.scale.setScalar(WEAPON_SCALE);

        mount.updateMatrix();
        hand.updateMatrixWorld(true);

        console.log("[HELD WEAPON] Mounted", {
            hand: hand.name,
            weaponType: normalizedWeaponType,
            position: mount.position.toArray(),
            rotation: mount.rotation.toArray(),
            scale: mount.scale.toArray(),
            children: mount.children.length,
        });

        return () => {
            if (mount.parent === hand) {
                hand.remove(mount);
            }
        };
    }, [hand, normalizedWeaponType]);

    if (normalizedWeaponType !== "rifle" || !hand) {
        return null;
    }

    return (
        <group ref={mountRef}>
            <WeaponModel weaponType={normalizedWeaponType} />
        </group>
    );
}

// ============================================================
// CHARACTER
// ============================================================

export default function Character3D({
    moving = false,
    weaponType = "",
}: Props) {
    const { scene, animations } = useGLTF(MODEL_PATH);

    const clonedScene = useMemo(
        () => SkeletonUtils.clone(scene),
        [scene],
    );

    const { actions } = useAnimations(
        animations,
        clonedScene,
    );

    // ========================================================
    // MODEL DEBUG
    // ========================================================

    useEffect(() => {
        clonedScene.updateMatrixWorld(true);

        const box = new Box3().setFromObject(clonedScene);
        const size = new Vector3();

        box.getSize(size);

        const rightHand = findBone(clonedScene, [
            "RightHand",
            "mixamorig:RightHand",
            "mixamorigRightHand",
        ]);

        console.log("[Character3D] Model size:", {
            x: size.x,
            y: size.y,
            z: size.z,
        });

        console.log(
            "[Character3D] Right hand:",
            rightHand?.name ?? "NOT FOUND",
        );

        console.log(
            "[Character3D] Current weaponType:",
            weaponType,
        );
    }, [clonedScene, weaponType]);

    // ========================================================
    // ANIMATION
    // ========================================================

    useEffect(() => {
        const animation = actions["mixamo.com"];

        if (!animation) {
            console.warn(
                "[Character3D] Animation not found",
                Object.keys(actions),
            );

            return;
        }

        if (moving) {
            animation
                .reset()
                .setLoop(LoopRepeat, Infinity)
                .fadeIn(0.15)
                .play();
        } else {
            animation.stop();
        }

        return () => {
            animation.stop();
        };
    }, [actions, moving]);

    // ========================================================
    // RENDER
    // ========================================================

    return (
        <group scale={MODEL_SCALE}>
            <primitive object={clonedScene} />

            <CharacterClothing root={clonedScene} />

            <HeldWeapon
                root={clonedScene}
                weaponType={weaponType}
            />
        </group>
    );
}

useGLTF.preload(MODEL_PATH);
