
"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { RefObject } from "react";
import { Quaternion, Vector3 } from "three";
import type { Bone, Object3D } from "three";

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
    leftHandTargetRef: RefObject<Object3D | null>;
    leftHandGripTargetRef: RefObject<Object3D | null>;
};

const POSITION_EPSILON = 0.002;
const MAX_STEP_ANGLE = Math.PI / 18;
const MAX_AIM_STEP_ANGLE = Math.PI / 36;

export function useLeftHandRifleIK({
    root,
    bones,
    weaponType,
    moving,
    aiming,
    leftHandTargetRef,
    leftHandGripTargetRef,
}: Props) {
    const worldHand = useMemo(() => new Vector3(), []);
    const worldGrip = useMemo(() => new Vector3(), []);
    const worldJoint = useMemo(() => new Vector3(), []);

    const fromDirection = useMemo(() => new Vector3(), []);
    const toDirection = useMemo(() => new Vector3(), []);

    const worldDelta = useMemo(() => new Quaternion(), []);
    const stepDelta = useMemo(() => new Quaternion(), []);
    const parentWorldQ = useMemo(() => new Quaternion(), []);
    const inverseParentQ = useMemo(() => new Quaternion(), []);
    const localDelta = useMemo(() => new Quaternion(), []);

    const warnedRef = useRef(false);
    const debugFrameRef = useRef(0);

    useFrame(() => {
        const normalized = String(weaponType ?? "")
            .trim()
            .toLowerCase()
            .replace(/[\s-]+/g, "_");

        const hasRifle =
            normalized.includes("rifle") ||
            normalized === "ak47" ||
            normalized === "ak_47";

        if (!hasRifle) return;

        const { shoulder, forearm, hand } = bones;
        const handTarget = leftHandTargetRef.current;
        const gunGrip = leftHandGripTargetRef.current;
if (!handTarget || !gunGrip || !hand || !forearm || !shoulder) {
    return;
}

if (aiming && !warnedRef.current) {
    console.log("[IK INIT CHECK]", {
        hand: hand.name,
        handTarget: handTarget.name,
        targetParent: handTarget.parent?.name,
        gunGrip: gunGrip.name,
        gripParent: gunGrip.parent?.name,
        targetFound: Boolean(leftHandTargetRef.current),
        gripFound: Boolean(leftHandGripTargetRef.current),
    });

    warnedRef.current = true;
}
        if (!shoulder || !forearm || !hand || !handTarget || !gunGrip) {
            return;
        }

        // LeftHandTarget phải là con/cháu của xương bàn tay.
        let ancestor: Object3D | null = handTarget;
        let targetBelongsToHand = false;

        while (ancestor) {
            if (ancestor === hand) {
                targetBelongsToHand = true;
                break;
            }

            ancestor = ancestor.parent;
        }

        if (!targetBelongsToHand) {
            if (!warnedRef.current) {
                console.error(
                    "[LeftHandRifleIK] LeftHandTarget không nằm trong LeftHand.",
                    {
                        target: handTarget.name,
                        parent: handTarget.parent?.name,
                        hand: hand.name,
                    },
                );

                warnedRef.current = true;
            }

            return;
        }

        warnedRef.current = false;

        // Bàn tay trước, cẳng tay tiếp theo, cuối cùng là vai.
        // Không thay đổi pose hoặc scale của súng.
        const joints: Bone[] = [hand, forearm, shoulder];

        const iterations = aiming ? 120 : moving ? 48 : 72;
        const maxStepAngle = aiming
            ? MAX_AIM_STEP_ANGLE
            : MAX_STEP_ANGLE;

        // Đồng bộ world matrix trước khi tính sai số.
        root.updateWorldMatrix(true, true);

        for (let iteration = 0; iteration < iterations; iteration++) {
            handTarget.updateWorldMatrix(true, false);
            gunGrip.updateWorldMatrix(true, false);

            handTarget.getWorldPosition(worldHand);
            gunGrip.getWorldPosition(worldGrip);

            const distance = worldHand.distanceTo(worldGrip);

            if (distance <= POSITION_EPSILON) {
                break;
            }

            for (const joint of joints) {
                if (!joint.parent) continue;

                // Cập nhật lại sau mỗi khớp vì khớp trước đó
                // đã làm thay đổi vị trí marker trên bàn tay.
                root.updateWorldMatrix(true, true);
                handTarget.updateWorldMatrix(true, false);
                gunGrip.updateWorldMatrix(true, false);

                handTarget.getWorldPosition(worldHand);
                gunGrip.getWorldPosition(worldGrip);
                joint.getWorldPosition(worldJoint);

                fromDirection.subVectors(worldHand, worldJoint);
                toDirection.subVectors(worldGrip, worldJoint);

                if (
                    fromDirection.lengthSq() < 1e-10 ||
                    toDirection.lengthSq() < 1e-10
                ) {
                    continue;
                }

                fromDirection.normalize();
                toDirection.normalize();

                // Góc quay trong world space để đưa điểm trên tay
                // tiến gần đến điểm grip trên ốp súng.
                worldDelta.setFromUnitVectors(
                    fromDirection,
                    toDirection,
                );

                const angle =
                    2 *
                    Math.acos(
                        Math.min(1, Math.max(-1, worldDelta.w)),
                    );

                if (angle < 1e-7) continue;

                const ratio = Math.min(
                    1,
                    maxStepAngle / angle,
                );

                stepDelta.identity().slerp(worldDelta, ratio);

                // Chuyển phép quay từ world space sang local space
                // của khớp trước khi cập nhật quaternion.
                joint.parent.getWorldQuaternion(parentWorldQ);

                inverseParentQ.copy(parentWorldQ).invert();

                localDelta
                    .copy(inverseParentQ)
                    .multiply(stepDelta)
                    .multiply(parentWorldQ);

                joint.quaternion.premultiply(localDelta);
                joint.updateMatrix();

                // Tính lại world transform ngay để khớp tiếp theo
                // sử dụng vị trí mới nhất của cả hai marker.
                root.updateWorldMatrix(true, true);
            }
        }

        // Kiểm tra khoảng cách thực tế sau khi giải IK.
        if (aiming) {
            debugFrameRef.current++;

            if (debugFrameRef.current % 30 === 0) {
                root.updateWorldMatrix(true, true);
                handTarget.updateWorldMatrix(true, false);
                gunGrip.updateWorldMatrix(true, false);

                handTarget.getWorldPosition(worldHand);
                gunGrip.getWorldPosition(worldGrip);

                console.log("[AIM LEFT HAND IK]", {
                    distance: Number(
                        worldHand.distanceTo(worldGrip).toFixed(4),
                    ),
                    handWorld: worldHand.toArray().map((v) =>
                        Number(v.toFixed(3)),
                    ),
                    gripWorld: worldGrip.toArray().map((v) =>
                        Number(v.toFixed(3)),
                    ),
                    iterations,
                });
            }
        } else {
            debugFrameRef.current = 0;
        }
    });

}
