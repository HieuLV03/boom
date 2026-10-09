
"use client";

import {
    useEffect,
    useMemo,
} from "react";

import {
    useGLTF,
    useAnimations,
} from "@react-three/drei";

import {
    SkeletonUtils,
} from "three-stdlib";

import {
    LoopRepeat,
} from "three";

import type {
    Object3D,
    Mesh,
} from "three";

// ============================================================
// MODEL
// ============================================================

const MODEL_PATH = "/models/character/character.glb";
const MODEL_SCALE = 0.015;

// ============================================================
// PROPS
// ============================================================

type Props = {
    moving?: boolean;
};

// ============================================================
// CHARACTER 3D
// ============================================================

export default function Character3D({
    moving = false,
}: Props) {

    const {
        scene,
        animations,
    } = useGLTF(MODEL_PATH);

    // Mỗi nhân vật có một bản sao model riêng.
    // Cần clone bằng SkeletonUtils để hỗ trợ model có skeleton.
    const clonedScene = useMemo(
        () => SkeletonUtils.clone(scene),
        [scene],
    );

    const {
        actions,
        names,
    } = useAnimations(
        animations,
        clonedScene,
    );

    // ========================================================
    // DEBUG MODEL
    // ========================================================

    useEffect(() => {
        let meshCount = 0;

        clonedScene.traverse((object) => {
            if ((object as Mesh).isMesh) {
                meshCount++;
            }
        });

        console.log("[MODEL CHECK]", {
            model: MODEL_PATH,
            meshCount,
            visible: clonedScene.visible,
            scale: MODEL_SCALE,
            position: clonedScene.position.toArray(),
            animations: names,
        });
    }, [clonedScene, names]);

    // ========================================================
    // MOVEMENT ANIMATION
    // ========================================================

    useEffect(() => {
        const animation = actions["mixamo.com"];

        if (!animation) {
            console.warn(
                "[Character3D] Animation mixamo.com not found",
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
        <primitive
            object={clonedScene}
            scale={MODEL_SCALE}
        />
    );
}

// ============================================================
// PRELOAD
// ============================================================

useGLTF.preload(MODEL_PATH);
