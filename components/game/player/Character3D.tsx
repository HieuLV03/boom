
"use client";

import {
    useEffect,
    useMemo,
    useRef,
} from "react";
import { useLeftHandRifleIK } from "./LeftHandRifleIK";
import type { RefObject } from "react";
import {
    createPortal,
    useFrame,
} from "@react-three/fiber";

import {
    useAnimations,
    useGLTF,
} from "@react-three/drei";

import { SkeletonUtils } from "three-stdlib";

import {
    Box3,
    CapsuleGeometry,
    Color,
    Euler,
    LoopOnce,
    LoopRepeat,
    Mesh,
    MeshStandardMaterial,
    Quaternion,
    SphereGeometry,
    Vector3,
} from "three";

import type {
    AnimationAction,
    Bone,
    Object3D,
} from "three";

import WeaponModel from "../weapons/WeaponModel";

// ============================================================
// CONFIG
// ============================================================


const MODEL_PATH = "/models/character/character.glb";

const MODEL_SCALE = 1.2;

const HELD_WEAPON_POSES = {
    // Súng khi đứng yên
    idle: {
        position: [3, 21, 0] as [number, number, number],
        rotationDeg: [180, 9, -90] as [number, number, number],
    },
    // Súng khi chạy
    run: {
        position: [-5, 21, 0] as [number, number, number],
        rotationDeg: [180, 9, -90] as [number, number, number],
    },
    // Súng khi ngắm
    aim: {
        position: [-11, 21, 6] as [number, number, number],
        rotationDeg: [180, -10, -110] as [number, number, number],
    },
    mountScale: 1,
    modelScale: 33,
};
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
    movingBackward?: boolean;
    running?: boolean;
    crouching?: boolean;
    punchTrigger?: number;
    aiming?: boolean;
    jumpTrigger?: number;
    hitTrigger?: number;
    weaponType?: string;
    hp?: number;
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

        if (found) return found;
    }

    for (const name of names) {
        const found = bones.find(
            (bone) => normalizeName(bone.name).endsWith(name),
        );

        if (found) return found;
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

        mesh.scale.set(
            radius,
            length / 3,
            radius * depthRatio,
        );
    });

    useEffect(() => {
        return () => geometry.dispose();
    }, [geometry]);

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

        if (!mesh || !bone) return;

        root.updateMatrixWorld(true);

        bone.getWorldPosition(position);
        root.worldToLocal(position);

        mesh.position
            .copy(position)
            .add(localOffset);
    });

    useEffect(() => {
        return () => geometry.dispose();
    }, [geometry]);

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
// CHARACTER CLOTHING
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

        leftLeg: findBone(root, ["LeftLeg"]),
        leftFoot: findBone(root, ["LeftFoot"]),

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
    running,
    aiming,
    leftHandGripTargetRef,
}: {
    root: Object3D;
    weaponType: string;
    running: boolean;
    aiming: boolean;
    leftHandGripTargetRef: {
        current: Object3D | null;
    };
}) {
    const normalizedWeaponType = String(weaponType ?? "")
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, "_");

    const isRifle =
        normalizedWeaponType === "rifle" ||
        normalizedWeaponType === "assault_rifle" ||
        normalizedWeaponType === "ak47" ||
        normalizedWeaponType === "ak_47";

    const rightHand = useMemo(
        () =>
            findBone(root, [
                "mixamorigRightHand",
                "mixamorig:RightHand",
                "RightHand",
            ]),
        [root],
    );

    const pose = aiming
        ? HELD_WEAPON_POSES.aim
        : running
          ? HELD_WEAPON_POSES.run
          : HELD_WEAPON_POSES.idle;

    useEffect(() => {
        if (!isRifle) return;

        console.log("[HELD WEAPON]", {
            rightHand: rightHand?.name ?? "NOT FOUND",
            pose: aiming ? "aim" : running ? "run" : "idle",
            position: pose.position,
            rotationDeg: pose.rotationDeg,
            scale: HELD_WEAPON_POSES.modelScale,
        });
    }, [isRifle, rightHand, aiming, running, pose]);

    if (!isRifle || !rightHand) return null;

    const [rx, ry, rz] = pose.rotationDeg;

    return createPortal(
        <group
            name="HeldRifleMount"
            position={pose.position}
            rotation={[
                (rx * Math.PI) / 180,
                (ry * Math.PI) / 180,
                (rz * Math.PI) / 180,
            ]}
            scale={HELD_WEAPON_POSES.mountScale}
        >
         <WeaponModel
    weaponType="rifle"
    modelPath="/models/gun/rifle/ak47.glb"
    scale={HELD_WEAPON_POSES.modelScale}
    leftHandGripTargetRef={leftHandGripTargetRef}
/>
        </group>,
        rightHand,
    );
}



// ============================================================
// CHARACTER
// ============================================================


export default function Character3D({
    moving = false,
    movingBackward = false,
    running = false,
    crouching = false,
    aiming = false,
    punchTrigger = 0,
    jumpTrigger = 0,
    weaponType = "",
    hitTrigger = 0,
    hp = 100,
}: Props) {
    const { scene, animations } = useGLTF(MODEL_PATH);

    const clonedScene = useMemo(
        () => SkeletonUtils.clone(scene),
        [scene],
    );

    const leftHandGripTargetRef = useRef<Object3D | null>(null);
const leftHandTargetRef = useRef<Object3D | null>(null);

// Lấy marker LeftHandTarget từ GLB nhân vật.
useEffect(() => {
    const marker = clonedScene.getObjectByName("LeftHandTarget");

    leftHandTargetRef.current = marker ?? null;

    if (!marker) {
        console.error(
            '[Character3D] Không tìm thấy marker "LeftHandTarget" trong model nhân vật.',
        );
    }

    return () => {
        leftHandTargetRef.current = null;
    };
}, [clonedScene]);



const leftArmBones = useMemo(() => ({
    shoulder: findBone(clonedScene, [
        "mixamorigLeftArm",
        "mixamorig:LeftArm",
        "LeftArm",
    ]),

    forearm: findBone(clonedScene, [
        "mixamorigLeftForeArm",
        "mixamorig:LeftForeArm",
        "LeftForeArm",
        "LeftForearm",
    ]),

    hand: findBone(clonedScene, [
        "mixamorigLeftHand",
        "mixamorig:LeftHand",
        "LeftHand",
    ]),
}), [clonedScene]);

// Lấy marker lòng bàn tay và kiểm tra hierarchy.
useEffect(() => {
    const marker = clonedScene.getObjectByName("LeftHandTarget");
    const hand = leftArmBones.hand;

    leftHandTargetRef.current = marker ?? null;

    let parent = marker?.parent;
    let markerUnderHand = false;

    while (parent) {
        if (parent === hand) {
            markerUnderHand = true;
            break;
        }
        parent = parent.parent;
    }

    console.log("[LEFT HAND IK CHECK]", {
        markerFound: Boolean(marker),
        markerName: marker?.name,
        markerParent: marker?.parent?.name,
        leftHandBone: hand?.name,
        markerUnderHand,
    });

    if (!marker) {
        console.error(
            '[Character3D] Không tìm thấy marker "LeftHandTarget".',
        );
    } else if (!markerUnderHand) {
        console.error(
            '[Character3D] LeftHandTarget phải nằm trong hierarchy của xương LeftHand.',
        );
    }

    console.table({
        leftShoulder: leftArmBones.shoulder?.name ?? "NOT FOUND",
        leftForearm: leftArmBones.forearm?.name ?? "NOT FOUND",
        leftHand: hand?.name ?? "NOT FOUND",
    });

    return () => {
        leftHandTargetRef.current = null;
    };
}, [clonedScene, leftArmBones]);

useEffect(() => {
    const marker = clonedScene.getObjectByName("LeftHandTarget");
    const hand = leftArmBones.hand;

    let parent = marker?.parent;
    let belongsToLeftHand = false;

    while (parent) {
        if (parent === hand) {
            belongsToLeftHand = true;
            break;
        }
        parent = parent.parent;
    }

    console.log("[LEFT HAND IK CHECK]", {
        markerFound: Boolean(marker),
        markerName: marker?.name,
        markerParent: marker?.parent?.name,
        leftHandBone: hand?.name,
        markerUnderLeftHandBone: belongsToLeftHand,
    });
}, [clonedScene, leftArmBones.hand]);

// Đặt useEffect kiểm tra ngay bên dưới leftArmBones.
useEffect(() => {
    const marker = clonedScene.getObjectByName("LeftHandTarget");
    const hand = leftArmBones.hand;

    let parent = marker?.parent;
    let belongsToLeftHand = false;

    while (parent) {
        if (parent === hand) {
            belongsToLeftHand = true;
            break;
        }
        parent = parent.parent;
    }

    console.log("[LEFT HAND IK CHECK]", {
        markerFound: Boolean(marker),
        markerParent: marker?.parent?.name,
        leftHandBone: hand?.name,
        markerUnderLeftHandBone: belongsToLeftHand,
    });
}, [clonedScene, leftArmBones.hand]);


useEffect(() => {
    console.table({
        leftShoulder:
            leftArmBones.shoulder?.name ?? "NOT FOUND",
        leftForearm:
            leftArmBones.forearm?.name ?? "NOT FOUND",
        leftHand:
            leftArmBones.hand?.name ?? "NOT FOUND",
    });
}, [leftArmBones]);



    const activeActionRef =
        useRef<AnimationAction | null>(null);

    const locomotionActionRef =
        useRef<AnimationAction | null>(null);


const punchingRef = useRef(false);
const jumpingRef = useRef(false);
const hitReactRef = useRef(false);

const hitActionRef = useRef<AnimationAction | null>(null);
const hitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

const lastPunchTriggerRef = useRef(punchTrigger);
const lastJumpTriggerRef = useRef(jumpTrigger);

// Theo dõi HP để nhận biết một lần mất máu thực sự.
const lastHpRef = useRef(hp);
const HIT_REACTION_MS = 450;

const { actions, mixer } = useAnimations(
    animations,
    clonedScene,
);

// Đăng ký IK sau callback cập nhật animation.
useLeftHandRifleIK({
    root: clonedScene,
    bones: leftArmBones,
    weaponType,
    moving,
    aiming,
    leftHandTargetRef,
    leftHandGripTargetRef,
});
const rifleArmBones = useMemo(() => ({
    rightArm: findBone(clonedScene, [
        "mixamorigRightArm",
        "mixamorig:RightArm",
        "RightArm",
    ]),

    rightForeArm: findBone(clonedScene, [
        "mixamorigRightForeArm",
        "mixamorig:RightForeArm",
        "RightForeArm",
        "RightForearm",
    ]),

    leftArm: findBone(clonedScene, [
        "mixamorigLeftArm",
        "mixamorig:LeftArm",
        "LeftArm",
    ]),

    leftForeArm: findBone(clonedScene, [
        "mixamorigLeftForeArm",
        "mixamorig:LeftForeArm",
        "LeftForeArm",
        "LeftForearm",
    ]),
}), [clonedScene]);

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
            "[Character3D] Animation clips:",
            animations.map((clip) => ({
                name: clip.name,
                duration: clip.duration,
                tracks: clip.tracks.length,
            })),
        );
    }, [clonedScene, animations]);

    // ========================================================
    // FIND ANIMATION ACTION
    // ========================================================

  const findAction = (
    pattern: RegExp,
): AnimationAction | null => {
    for (const [name, action] of Object.entries(actions)) {
        if (action && pattern.test(name)) {
            return action;
        }
    }

    // Dự phòng nếu key trong actions không trùng tên clip
    const clip = animations.find((item) => pattern.test(item.name));

    if (!clip) return null;

    return mixer.clipAction(clip, clonedScene);
};

    // ========================================================
    // CHOOSE LOCOMOTION
    // ========================================================

const getLocomotionAction = (): AnimationAction | null => {
    const normalizedWeaponType = String(weaponType ?? "")
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, "_");

const hasRifle =
    normalizedWeaponType.includes("rifle") ||
    normalizedWeaponType === "ak47" ||
    normalizedWeaponType === "ak_47";
    // Animation ngắm súng
    const aimIdleAction =
        findAction(/^male_aim_idle$/i);

    const aimWalkAction =
        findAction(/^male_aim_walk$/i);

    // Animation cầm súng
    const rifleIdleAction =
        findAction(/^male_rifle_idle$/i);

    const rifleWalkingAction =
        findAction(/^male_rifle_walking$/i);

    const rifleWalkBackAction =
        findAction(/^male_rifle_walk_back$/i);

    // Animation mặc định
    const idleAction =
        findAction(/^male_idle$/i) ??
        findAction(/^idle$/i) ??
        findAction(/idle/i);

    const walkingAction =
        findAction(/^male_walking$/i) ??
        findAction(/walking|walk/i);

    const runAction =
        findAction(/^male_run$/i) ??
        findAction(/running|run/i);

    const crouchIdleAction =
        findAction(/^male_crouch_idle$/i) ??
        findAction(/crouch.*idle|idle.*crouch/i);

    const crouchWalkingAction =
        findAction(/^male_crouch_walking$/i) ??
        findAction(/crouch.*walk|walk.*crouch/i);

    // 1. Cúi người: giữ nguyên logic hiện tại
  
    // 1. Đang giữ nút bắn và có súng:
    // Ưu tiên animation ngắm trước cả trạng thái cúi.
    if (hasRifle && aiming) {
        if (moving) {
            return (
                aimWalkAction ??
                rifleWalkingAction ??
                walkingAction ??
                idleAction
            );
        }

        return (
            aimIdleAction ??
            rifleIdleAction ??
            idleAction ??
            walkingAction
        );
    }

    // 2. Cúi người.
    if (crouching) {
        return moving
            ? crouchWalkingAction ??
                  walkingAction ??
                  idleAction
            : crouchIdleAction ??
                  idleAction;
    }

    // 3. Cầm súng và đi lùi.
    if (hasRifle && moving && movingBackward) {
        return (
            rifleWalkBackAction ??
            rifleWalkingAction ??
            walkingAction ??
            idleAction
        );
    }

    // 4. Chạy.
 // 4. Chạy.
// Ưu tiên animation cầm súng để tay không chuyển về tư thế tay không.
if (moving && running) {
    if (hasRifle) {
        return (
            rifleWalkingAction ??
            runAction ??
            walkingAction ??
            idleAction
        );
    }

    return runAction ?? walkingAction ?? idleAction;
}
    // 5. Cầm súng nhưng không ngắm.
    if (hasRifle) {
        return moving
            ? rifleWalkingAction ??
                  walkingAction ??
                  idleAction
            : rifleIdleAction ??
                  idleAction ??
                  walkingAction;
    }

    // 6. Không cầm súng.
    return moving
        ? walkingAction ?? runAction ?? idleAction
        : idleAction ?? walkingAction ?? runAction;
};


useEffect(() => {
    const previousHp = lastHpRef.current;

    // Cập nhật HP đã ghi nhận trước khi xử lý.
    lastHpRef.current = hp;

    // Chỉ phản ứng khi HP thực sự giảm.
    if (hp >= previousHp) {
        return;
    }

    // Đang phản ứng với một đòn đánh thì bỏ qua
    // các cập nhật HP tiếp theo trong thời gian khóa.
    if (hitReactRef.current) {
        console.log("[HIT] Bỏ qua sát thương trong thời gian khóa:", {
            previousHp,
            currentHp: hp,
        });
        return;
    }

    const hitAction =
        actions["male_hit"] ??
        findAction(/^male_hit$/i);

    if (!hitAction) {
        console.error("[HIT] Không tìm thấy animation male_hit");
        return;
    }

    // Khóa trước khi phát animation để tránh kích hoạt trùng.
    hitReactRef.current = true;
    hitActionRef.current = hitAction;

    punchingRef.current = false;
    jumpingRef.current = false;

    for (const action of Object.values(actions)) {
        if (!action || action === hitAction) continue;

        action.stopFading();
        action.fadeOut(0.05);
    }

    hitAction.stopFading();
    hitAction.stop();
    hitAction.reset();

    hitAction.enabled = true;
    hitAction.setLoop(LoopOnce, 1);
    hitAction.clampWhenFinished = true;
    hitAction.setEffectiveWeight(1);
    hitAction.setEffectiveTimeScale(1);
    hitAction.fadeIn(0.05);
    hitAction.play();

    activeActionRef.current = hitAction;

    console.log("[HIT] Phát male_hit một lần:", {
        previousHp,
        currentHp: hp,
        duration: hitAction.getClip().duration,
    });

    if (hitTimeoutRef.current !== null) {
        clearTimeout(hitTimeoutRef.current);
    }

    hitTimeoutRef.current = setTimeout(() => {
        hitTimeoutRef.current = null;

        hitReactRef.current = false;
        hitActionRef.current = null;

        hitAction.stopFading();
        hitAction.fadeOut(0.1);

        const nextAction = getLocomotionAction();

        if (!nextAction) {
            console.warn("[HIT] Không tìm thấy animation để trở về.");
            return;
        }

        for (const action of Object.values(actions)) {
            if (!action || action === nextAction) continue;

            action.stopFading();
            action.fadeOut(0.1);
        }

        nextAction.stopFading();
        nextAction.enabled = true;
        nextAction.reset();
        nextAction.setLoop(LoopRepeat, Infinity);
        nextAction.clampWhenFinished = false;
        nextAction.setEffectiveWeight(1);
        nextAction.setEffectiveTimeScale(1);
        nextAction.fadeIn(0.12).play();

        activeActionRef.current = nextAction;

        console.log("[HIT] Kết thúc phản ứng, trở về:", {
            clip: nextAction.getClip().name,
        });
    }, HIT_REACTION_MS);
}, [hp, actions, animations, mixer]);

// Dọn timer khi component bị tháo khỏi scene.
useEffect(() => {
    return () => {
        if (hitTimeoutRef.current !== null) {
            clearTimeout(hitTimeoutRef.current);
            hitTimeoutRef.current = null;
        }
    };
}, []);

// ========================================================
// Phát male_hit khi HP giảm, sau đó trở về locomotion.
// ========================================================


useEffect(() => {
    const hitAction =
        actions["male_hit"] ??
        findAction(/^male_hit$/i);

    if (!hitAction) {
        console.warn(
            "[ANIMATION] Không tìm thấy male_hit để đăng ký finished.",
            animations.map((clip) => clip.name),
        );
        return;
    }

}, [
    actions,
    animations,
    mixer,
    weaponType,
    moving,
    movingBackward,
    running,
    crouching,
    aiming,
]);

    // ========================================================
    // DEBUG RIFLE ANIMATION
    // ========================================================

  useEffect(() => {
    const normalizedWeaponType = String(weaponType ?? "")
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, "_");

const hasRifle =
    normalizedWeaponType.includes("rifle") ||
    normalizedWeaponType === "ak47" ||
    normalizedWeaponType === "ak_47";

    const aimIdleAction = findAction(/^male_aim_idle$/i);
    const aimWalkAction = findAction(/^male_aim_walk$/i);
    const rifleIdleAction = findAction(/^male_rifle_idle$/i);

    const selectedAction = getLocomotionAction();

    console.log("[AIM ANIMATION DEBUG]", {
        aiming,
        weaponType,
        hasRifle,
        moving,
        crouching,
        aimIdleFound: Boolean(aimIdleAction),
        aimWalkFound: Boolean(aimWalkAction),
        rifleIdleFound: Boolean(rifleIdleAction),
        selectedClip:
            selectedAction?.getClip().name ?? "NOT FOUND",
    });
}, [
    aiming,
    weaponType,
    moving,
    movingBackward,
    running,
    crouching,
    actions,
    animations,
]);


useEffect(() => {
    const nextAction = getLocomotionAction();

    locomotionActionRef.current = nextAction;

if (
    !nextAction ||
    punchingRef.current ||
    jumpingRef.current ||
    hitReactRef.current
) {
    return;
}

    const previousAction = activeActionRef.current;

    // Đã phát đúng animation thì không reset lại.
    if (
        previousAction === nextAction &&
        nextAction.isRunning()
    ) {
        return;
    }

    // Dừng các animation khác.
    for (const action of Object.values(actions)) {
        if (!action || action === nextAction) continue;

        action.stopFading();
        action.fadeOut(0.12);
    }

    // Chỉ khởi động animation được chọn một lần.
    nextAction.stopFading();
    nextAction.enabled = true;
    nextAction.reset();
    nextAction.setLoop(LoopRepeat, Infinity);
    nextAction.clampWhenFinished = false;
    nextAction.setEffectiveWeight(1);
    nextAction.setEffectiveTimeScale(1);
    nextAction.fadeIn(0.12).play();

    activeActionRef.current = nextAction;

    console.log("[ANIMATION ACTIVE]", {
        weaponType,
        normalizedWeaponType: String(weaponType ?? "")
            .trim()
            .toLowerCase()
            .replace(/[\s-]+/g, "_"),
        moving,
        aiming,
        crouching,
        clip: nextAction.getClip().name,
    });
}, [
    actions,
    moving,
    movingBackward,
    running,
    crouching,
    aiming,
    weaponType,
]);


    // ========================================================
    // ANIMATION: JUMP FINISHED
    // ========================================================

    useEffect(() => {
        const jumpAction =
            actions["male_jump"] ??
            findAction(/^jump$/i) ??
            findAction(/jump/i);

        if (!jumpAction) {
            console.warn(
                "[ANIMATION] Không tìm thấy animation Jump.",
            );
            return;
        }

        const handleFinished = (
            event: { action?: AnimationAction },
        ) => {
            if (event.action !== jumpAction) return;

            jumpingRef.current = false;

         const nextAction = locomotionActionRef.current;

if (
    !nextAction ||
    punchingRef.current ||
    hitReactRef.current
) {
    return;
}

            jumpAction.fadeOut(0.1);

            nextAction.enabled = true;
            nextAction.reset();
            nextAction.setLoop(LoopRepeat, Infinity);
            nextAction.clampWhenFinished = false;
            nextAction.setEffectiveWeight(1);
            nextAction.fadeIn(0.15).play();

            activeActionRef.current = nextAction;
        };

        mixer.addEventListener("finished", handleFinished);

        return () => {
            mixer.removeEventListener(
                "finished",
                handleFinished,
            );
        };
    }, [actions, mixer]);

    // ========================================================
    // ANIMATION: JUMP TRIGGER
    // ========================================================

    useEffect(() => {
        if (jumpTrigger === lastJumpTriggerRef.current) {
            return;
        }

        lastJumpTriggerRef.current = jumpTrigger;

        if (punchingRef.current || jumpingRef.current) {
            return;
        }

        const jumpAction =
            actions["male_jump"] ??
            findAction(/^jump$/i) ??
            findAction(/jump/i);

        if (!jumpAction) {
            console.warn(
                "[ANIMATION] Không tìm thấy clip Jump trong GLB.",
            );
            return;
        }

        jumpingRef.current = true;

        for (const action of Object.values(actions)) {
            if (action && action !== jumpAction) {
                action.fadeOut(0.1);
            }
        }

        jumpAction.enabled = true;
        jumpAction.reset();
        jumpAction.setLoop(LoopOnce, 1);
        jumpAction.clampWhenFinished = true;
        jumpAction.setEffectiveWeight(1);
        jumpAction.setEffectiveTimeScale(1);
        jumpAction.fadeIn(0.1).play();

        activeActionRef.current = jumpAction;

        console.log("[ANIMATION] Jump started:", {
            clip: jumpAction.getClip().name,
            duration: jumpAction.getClip().duration,
        });
    }, [actions, jumpTrigger]);

    // ========================================================
    // ANIMATION: PUNCH FINISHED
    // ========================================================

    useEffect(() => {
        const punchAction = findAction(
            /punch|attack|melee/i,
        );

        if (!punchAction) {
            console.warn(
                "[ANIMATION] Không tìm thấy animation Punch.",
            );
            return;
        }

     const handleFinished = (
    event: { action?: AnimationAction },
) => {
    if (event.action !== punchAction) return;

    punchingRef.current = false;

    // Không được chuyển animation khi đang bị đánh.
    if (hitReactRef.current) return;

    if (jumpingRef.current) return;

    const nextAction = locomotionActionRef.current;
    if (!nextAction) return;

    punchAction.fadeOut(0.1);

    nextAction.enabled = true;
    nextAction.setLoop(LoopRepeat, Infinity);
    nextAction.clampWhenFinished = false;
    nextAction.setEffectiveWeight(1);
    nextAction.reset();
    nextAction.fadeIn(0.15).play();

    activeActionRef.current = nextAction;
};

        mixer.addEventListener("finished", handleFinished);

        return () => {
            mixer.removeEventListener(
                "finished",
                handleFinished,
            );
        };
    }, [actions, mixer]);

    // ========================================================
    // ANIMATION: PUNCH TRIGGER
    // ========================================================


useEffect(() => {
    if (punchTrigger === lastPunchTriggerRef.current) {
        return;
    }

    lastPunchTriggerRef.current = punchTrigger;

    // Không cho đấm ghi đè hit reaction hoặc animation nhảy.
    if (jumpingRef.current || hitReactRef.current) {
        return;
    }


        const punchAction = findAction(
            /punch|attack|melee/i,
        );

        if (!punchAction) {
            console.warn(
                "[ANIMATION] Không tìm thấy clip Punch trong GLB.",
            );
            return;
        }

        punchingRef.current = true;

        for (const action of Object.values(actions)) {
            if (action && action !== punchAction) {
                action.fadeOut(0.1);
            }
        }

        punchAction.enabled = true;
        punchAction.reset();
        punchAction.setLoop(LoopOnce, 1);
        punchAction.clampWhenFinished = true;
        punchAction.setEffectiveWeight(1);
        punchAction.setEffectiveTimeScale(1);
        punchAction.fadeIn(0.1).play();

        activeActionRef.current = punchAction;

        console.log("[ANIMATION] Punch started:", {
            clip: punchAction.getClip().name,
            duration: punchAction.getClip().duration,
        });
    }, [actions, punchTrigger]);

    // ========================================================
    // RENDER
    // ========================================================

// ========================================================
// RENDER
// ========================================================


return (
    <group scale={MODEL_SCALE}>
        <primitive object={clonedScene} />

        <CharacterClothing root={clonedScene} />

        {/* Bước 1: Gắn súng vào tay phải và đăng ký điểm grip. */}
        <HeldWeapon
            root={clonedScene}
            weaponType={weaponType}
            running={moving && running}
            aiming={aiming}
            leftHandGripTargetRef={leftHandGripTargetRef}
        />

        {/* Bước 2: Sau khi có target trên súng, IK đưa tay trái đến đó. */}

     
    </group>
);

}


useGLTF.preload(MODEL_PATH);
