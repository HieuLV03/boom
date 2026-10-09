
"use client";

import {
    useEffect,
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


// ============================================================
// CONFIG
// ============================================================

const MODEL_PATH = "/models/character/character.glb";
const MODEL_SCALE = 0.015;

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
    return name.toLowerCase().replace(/[^a-z0-9]/g, "");
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

    // Ưu tiên tên xương khớp chính xác.
    for (const name of names) {
        const found = bones.find(
            (bone) => normalizeName(bone.name) === name,
        );

        if (found) return found;
    }

    // Hỗ trợ tên có tiền tố như mixamorig:LeftArm.
    for (const name of names) {
        const found = bones.find(
            (bone) => normalizeName(bone.name).endsWith(name),
        );

        if (found) return found;
    }

    return null;
}


// ============================================================
// SEGMENT CLOTHING
// Mesh chạy từ xương đầu đến xương cuối.
// Tất cả kích thước tính theo đơn vị model gốc.
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

        if (!mesh || !start || !end) return;

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

        // CapsuleGeometry cao 3 đơn vị khi scale = 1.
        mesh.scale.set(
            radius,
            length / 3,
            radius * depthRatio,
        );
    });

    if (!start || !end) return null;

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
// ACCESSORY
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

        if (!mesh || !bone) return;

        root.updateMatrixWorld(true);

        bone.getWorldPosition(position);
        root.worldToLocal(position);

        mesh.position
            .copy(position)
            .add(localOffset);
    });

    if (!bone) return null;

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

        // Không phụ thuộc trực tiếp vào MODEL_SCALE.
        // Kích thước được lấy từ model gốc.
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
        leftForeArm: findBone(root, [
            "LeftForeArm",
            "LeftForearm",
        ]),

        rightArm: findBone(root, ["RightArm"]),
        rightForeArm: findBone(root, [
            "RightForeArm",
            "RightForearm",
        ]),

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
        console.log("[Character3D] Model dimensions:", dimensions);

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
            {/* HOODIE BODY */}
            <ClothingSegment
                root={root}
                start={bones.hips}
                end={bones.neck}
                material={materials.hoodie}
                radius={d.torsoRadius}
                depthRatio={0.75}
            />

            {/* SLEEVES */}
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

            {/* PANTS: THIGHS */}
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

            {/* PANTS: LOWER LEGS */}
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

            {/* SHOES */}
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

            {/* SOLES */}
            <ClothingAccessory
                root={root}
                bone={bones.leftFoot}
                material={materials.sole}
                scale={[
                    d.shoeWidth * 1.04,
                    d.shoeHeight * 0.35,
                    d.shoeLength * 1.04,
                ]}
                offset={[0, -d.shoeHeight * 0.7, 0]}
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
                offset={[0, -d.shoeHeight * 0.7, 0]}
            />

            {/* HOOD */}
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
// CHARACTER
// ============================================================

export default function Character3D({
    moving = false,
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

    useEffect(() => {
        clonedScene.updateMatrixWorld(true);

        const box = new Box3().setFromObject(clonedScene);
        const size = new Vector3();

        box.getSize(size);

        console.log("[Character3D] Model size:", {
            x: size.x,
            y: size.y,
            z: size.z,
        });
    }, [clonedScene]);

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

    return (
        <group scale={MODEL_SCALE}>
            <primitive object={clonedScene} />

            <CharacterClothing root={clonedScene} />
        </group>
    );
}

useGLTF.preload(MODEL_PATH);
