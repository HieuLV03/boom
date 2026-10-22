
"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { RefObject } from "react";

import {
    MathUtils,
    Mesh,
    MeshBasicMaterial,
    Quaternion,
    Vector3,
} from "three";

import type { Bone, Object3D } from "three";

// ============================================================
// ĐIỂM TRÊN LÒNG BÀN TAY TRÁI
// Giữ nguyên tọa độ bạn đã căn chỉnh ở giai đoạn 1.
// ============================================================

const PALM_CONTACT_LOCAL: [number, number, number] = [
    0,
    6,
    6,
];

const PALM_MARKER_SIZE = 0.035;

// Bắt đầu với lực thấp để tránh xoắn tay.
// Khi khớp đúng, có thể tăng dần các giá trị này.
const IK_WEIGHT_AIM = 0.55;
const IK_WEIGHT_MOVE = 0.35;
const IK_WEIGHT_IDLE = 0.3;

const MAX_STEP_ANGLE = 0.12;

type LeftArmBones = {
    shoulder: Bone | null;
    forearm: Bone | null;
    hand: Bone | null;
};

type Props = {
    root: Object3D;
    bones: LeftArmBones;
    weaponType: string;
    moving: boolean;
    aiming: boolean;
    leftHandGripTargetRef: RefObject<Object3D | null>;
};

export default function LeftHandRifleIK({
    root,
    bones,
    weaponType,
    moving,
    aiming,
    leftHandGripTargetRef,
}: Props) {
    const markerRef = useRef<Mesh>(null);

    const palmContactLocal = useMemo(
        () => new Vector3(...PALM_CONTACT_LOCAL),
        [],
    );

    const targetPosition = useMemo(
        () => new Vector3(),
        [],
    );

    const handPosition = useMemo(
        () => new Vector3(),
        [],
    );

    const jointPosition = useMemo(
        () => new Vector3(),
        [],
    );

    const toHand = useMemo(
        () => new Vector3(),
        [],
    );

    const toTarget = useMemo(
        () => new Vector3(),
        [],
    );

    const worldDelta = useMemo(
        () => new Quaternion(),
        [],
    );

    const parentWorldQ = useMemo(
        () => new Quaternion(),
        [],
    );

    const inverseParentQ = useMemo(
        () => new Quaternion(),
        [],
    );

    const localDelta = useMemo(
        () => new Quaternion(),
        [],
    );

    const identityQ = useMemo(
        () => new Quaternion(),
        [],
    );

    const markerMaterial = useMemo(
        () =>
            new MeshBasicMaterial({
                color: "#00ff66",
                depthTest: false,
                depthWrite: false,
                toneMapped: false,
            }),
        [],
    );

    useEffect(() => {
        return () => {
            markerMaterial.dispose();
        };
    }, [markerMaterial]);

    useFrame(() => {
        const normalized = String(weaponType ?? "")
            .trim()
            .toLowerCase()
            .replace(/[\s-]+/g, "_");

        const hasRifle =
            normalized.includes("rifle") ||
            normalized === "ak47" ||
            normalized === "ak_47";

        const { shoulder, forearm, hand } = bones;
        const gripTarget = leftHandGripTargetRef.current;
        const marker = markerRef.current;

        if (
            !hasRifle ||
            !shoulder ||
            !forearm ||
            !hand ||
            !gripTarget
        ) {
            if (marker) marker.visible = false;
            return;
        }

        if (marker) marker.visible = true;

        // Cập nhật model nhân vật và điểm mục tiêu trên súng.
        root.updateMatrixWorld(true);
        gripTarget.updateWorldMatrix(true, false);

        // Điểm cam: vị trí mục tiêu trên thân súng, world space.
        gripTarget.getWorldPosition(targetPosition);

        const ikWeight = aiming
            ? IK_WEIGHT_AIM
            : moving
                ? IK_WEIGHT_MOVE
                : IK_WEIGHT_IDLE;

        const iterations = aiming ? 8 : moving ? 5 : 4;

        // Ưu tiên xoay cẳng tay trước, sau đó xoay vai.
        // Không xoay trực tiếp xương bàn tay.
        const joints: Bone[] = [forearm, shoulder];

        for (let iteration = 0; iteration < iterations; iteration++) {
            for (const joint of joints) {
                root.updateMatrixWorld(true);

                // Điểm xanh thực tế trên lòng bàn tay.
                hand.localToWorld(
                    handPosition.copy(palmContactLocal),
                );

                // Vị trí khớp đang xét.
                joint.getWorldPosition(jointPosition);

                toHand.subVectors(
                    handPosition,
                    jointPosition,
                );

                toTarget.subVectors(
                    targetPosition,
                    jointPosition,
                );

                if (
                    toHand.lengthSq() < 1e-8 ||
                    toTarget.lengthSq() < 1e-8
                ) {
                    continue;
                }

                toHand.normalize();
                toTarget.normalize();

                // Tính góc xoay đưa hướng tới bàn tay
                // gần với hướng tới điểm trên súng.
                worldDelta.setFromUnitVectors(
                    toHand,
                    toTarget,
                );

                // Điều chỉnh từ từ, tránh giật mạnh.
                worldDelta.slerp(
                    identityQ,
                    1 - ikWeight,
                );

                if (!joint.parent) continue;

                // Chuyển phép xoay từ world space
                // sang local space của xương.
                joint.parent.getWorldQuaternion(parentWorldQ);

                inverseParentQ
                    .copy(parentWorldQ)
                    .invert();

                localDelta
                    .copy(inverseParentQ)
                    .multiply(worldDelta)
                    .multiply(parentWorldQ);

                // Giới hạn góc mỗi bước để giảm xoắn.
                const stepAngle =
                    2 *
                    Math.acos(
                        MathUtils.clamp(
                            Math.abs(localDelta.w),
                            0,
                            1,
                        ),
                    );

                if (stepAngle > MAX_STEP_ANGLE) {
                    localDelta.slerp(
                        identityQ,
                        1 - MAX_STEP_ANGLE / stepAngle,
                    );
                }

                joint.quaternion.premultiply(localDelta);
            }
        }

        // Tính lại vị trí điểm xanh sau khi IK.
        root.updateMatrixWorld(true);

        hand.localToWorld(
            handPosition.copy(palmContactLocal),
        );

        // Hiển thị chấm xanh đúng tại điểm tiếp xúc hiện tại.
        if (marker?.parent) {
            marker.position.copy(
                marker.parent.worldToLocal(
                    handPosition.clone(),
                ),
            );
        }
    });

    return (
        <mesh
            ref={markerRef}
            material={markerMaterial}
            renderOrder={999}
        >
            <sphereGeometry
                args={[PALM_MARKER_SIZE, 12, 12]}
            />
        </mesh>
    );
}
