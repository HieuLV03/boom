"use client";

import {
    useEffect,
    useRef,
} from "react";

import {
    useGLTF,
    useAnimations,
} from "@react-three/drei";

import type {
    Group,
} from "three";

import {
    LoopRepeat,
} from "three";


// ============================================================
// MODEL
// ============================================================

const MODEL_PATH =
    "/models/character/character.glb";

const MODEL_SCALE =
    0.015;


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

    const group =
        useRef<Group>(null);


    // ========================================================
    // GLTF
    // ========================================================

    const {
        scene,
        animations,
    } = useGLTF(
        MODEL_PATH
    );


    // ========================================================
    // ANIMATION
    // ========================================================

    const {
        actions,
        names,
    } =
        useAnimations(
            animations,
            group
        );


    // ========================================================
    // DEBUG
    // ========================================================

    useEffect(() => {

        console.log(
            "========================================"
        );

        console.log(
            "[Character3D] Animation names:",
            names
        );

        animations.forEach(
            (clip) => {

                console.log(
                    "[Character3D] Animation:",
                    {
                        name:
                            clip.name,

                        duration:
                            clip.duration,

                        tracks:
                            clip.tracks.length,
                    }
                );

            }
        );

        console.log(
            "[Character3D] Actions:",
            Object.keys(actions)
        );

        console.log(
            "========================================"
        );

    }, [
        names,
        actions,
        animations,
    ]);


    // ========================================================
    // MOVEMENT ANIMATION
    // ========================================================

    useEffect(() => {

        const animation =
            actions["mixamo.com"];


        // ----------------------------------------------------
        // Animation không tồn tại
        // ----------------------------------------------------

        if (!animation) {

            console.warn(
                "[Character3D] ❌ mixamo.com not found"
            );

            return;

        }


        // ----------------------------------------------------
        // ĐANG DI CHUYỂN
        // ----------------------------------------------------

        if (moving) {

            console.log(
                "[Character3D] ▶ WALK / RUN"
            );


            animation
                .reset()
                .setLoop(
                    LoopRepeat,
                    Infinity
                )
                .fadeIn(0.15)
                .play();


            return;

        }


        // ----------------------------------------------------
        // ĐỨNG YÊN
        // ----------------------------------------------------

        console.log(
            "[Character3D] ⏸ IDLE"
        );


        animation
            .fadeOut(0.15);


        animation.stop();


    }, [
        actions,
        moving,
    ]);


    // ========================================================
    // RENDER
    // ========================================================

    return (

        <group
            ref={group}
        >

            <primitive
                object={scene}
                scale={MODEL_SCALE}
            />

        </group>

    );

}


// ============================================================
// PRELOAD
// ============================================================

useGLTF.preload(
    MODEL_PATH
);