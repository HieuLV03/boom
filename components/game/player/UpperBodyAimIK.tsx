
"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
    MathUtils,
    Quaternion,
    Vector3,
} from "three";
import type { Bone, Object3D } from "three";

type Props = {
    root: Object3D;
    aiming: boolean;
    aimPitchRef?: { current: number };
};

type SpineKey = "spine" | "spine1" | "spine2";

function normalizeName(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function findBone(
    root: Object3D,
    candidates: string[],
): Bone | null {
    const names = candidates.map(normalizeName);
    let result: Bone | null = null;

    root.traverse((object) => {
        if (result || !(object as Bone).isBone) return;

        const name = normalizeName(object.name);

        if (
            names.some(
                (candidate) =>
                    name === candidate ||
                    name.endsWith(candidate),
            )
        ) {
            result = object as Bone;
        }
    });

    return result;
}

export default function UpperBodyAimIK({
    root,
    aimPitchRef,
}: Props) {
    const bones = useMemo(
        () => ({
            spine: findBone(root, [
                "mixamorigSpine",
                "mixamorig:Spine",
                "Spine",
            ]),
            spine1: findBone(root, [
                "mixamorigSpine1",
                "mixamorig:Spine1",
                "Spine1",
            ]),
            spine2: findBone(root, [
                "mixamorigSpine2",
                "mixamorig:Spine2",
                "Spine2",
            ]),
        }),
        [root],
    );

    const smoothedPitch = useRef(0);

    const lastAngles = useRef<Record<SpineKey, number>>({
        spine: 0,
        spine1: 0,
        spine2: 0,
    });

    const localX = useMemo(
        () => new Vector3(1, 0, 0),
        [],
    );

    const offset = useMemo(
        () => new Quaternion(),
        [],
    );

    const debugCounter = useRef(0);

    useEffect(() => {
        console.log("[UpperBodyAimIK] Bone check", {
            spine: bones.spine?.name ?? "NOT FOUND",
            spine1: bones.spine1?.name ?? "NOT FOUND",
            spine2: bones.spine2?.name ?? "NOT FOUND",
        });
    }, [bones]);

    useFrame((_, delta) => {
        const pitchInput = aimPitchRef?.current ?? 0;

        // Đọc góc pitch của hướng tâm ngắm.
        const targetPitch = MathUtils.clamp(
            pitchInput,
            -0.65,
            0.65,
        );

        smoothedPitch.current = MathUtils.damp(
            smoothedPitch.current,
            targetPitch,
            14,
            delta,
        );

        const parts: {
            key: SpineKey;
            bone: Bone | null;
            weight: number;
        }[] = [
            {
                key: "spine",
                bone: bones.spine,
                weight: 0.25,
            },
            {
                key: "spine1",
                bone: bones.spine1,
                weight: 0.35,
            },
            {
                key: "spine2",
                bone: bones.spine2,
                weight: 0.40,
            },
        ];

        const available = parts.filter(
            (part) => part.bone !== null,
        );

        const totalWeight = available.reduce(
            (sum, part) => sum + part.weight,
            0,
        );

        if (totalWeight === 0) return;

        for (const part of available) {
            const bone = part.bone!;

            // Gỡ góc đã áp dụng ở frame trước.
            const previousAngle =
                lastAngles.current[part.key];

            offset.setFromAxisAngle(
                localX,
                -previousAngle,
            );

            bone.quaternion
                .multiply(offset)
                .normalize();

            // Chia góc xoay cho từng đốt sống.
            const angle =
                -smoothedPitch.current *
                (part.weight / totalWeight);

            offset.setFromAxisAngle(localX, angle);

            bone.quaternion
                .multiply(offset)
                .normalize();

            lastAngles.current[part.key] = angle;
        }

        debugCounter.current++;

        if (debugCounter.current % 60 === 0) {
            console.log("[UPPER BODY AIM]", {
                pitchInput: Number(
                    pitchInput.toFixed(3),
                ),
                appliedPitch: Number(
                    smoothedPitch.current.toFixed(3),
                ),
                spineRotationX:
                    bones.spine?.rotation.x.toFixed(3),
                spine1RotationX:
                    bones.spine1?.rotation.x.toFixed(3),
                spine2RotationX:
                    bones.spine2?.rotation.x.toFixed(3),
            });
        }
    });

    return null;
}
