
"use client";

import { useFrame, useThree } from "@react-three/fiber";

import {
    useCameraStore,
} from "@/stores/camera.store";

import type { RefObject } from "react";
import type { Group } from "three";


// ============================================================
// TYPES
// ============================================================

type Props = {
    target: RefObject<Group | null>;
};


// ============================================================
// CAMERA SETTINGS
// ============================================================

const DISTANCE = 7;

const HEIGHT = 3;

const TARGET_HEIGHT = 1.1;

const SMOOTH_SPEED = 10;


// ============================================================
// CAMERA CONTROLLER
// ============================================================

export default function CameraController({
    target,
}: Props) {

    const { camera } =
        useThree();


    // ========================================================
    // FRAME
    // ========================================================

    useFrame((_, delta) => {

        const player =
            target.current;

        if (!player) {
            return;
        }


        // ====================================================
        // CAMERA STATE
        // ====================================================

        const {
            yaw,
            pitch,
        } =
            useCameraStore.getState();


        // ====================================================
        // CAMERA DISTANCE
        // ====================================================

        const horizontalDistance =
            DISTANCE *
            Math.cos(pitch);


        // ====================================================
        // TARGET POSITION
        // ====================================================

        const targetX =
            player.position.x;

        const targetY =
            player.position.y +
            TARGET_HEIGHT;

        const targetZ =
            player.position.z;


        // ====================================================
        // DESIRED CAMERA POSITION
        // ====================================================

        const cameraX =
            player.position.x -
            Math.sin(yaw) *
            horizontalDistance;

        const cameraY =
            player.position.y +
            HEIGHT +
            Math.sin(pitch) *
            DISTANCE;

        const cameraZ =
            player.position.z +
            Math.cos(yaw) *
            horizontalDistance;


        // ====================================================
        // SMOOTH CAMERA
        // ====================================================

        const smooth =
            1 -
            Math.exp(
                -SMOOTH_SPEED *
                delta
            );


        camera.position.x +=
            (
                cameraX -
                camera.position.x
            ) *
            smooth;

        camera.position.y +=
            (
                cameraY -
                camera.position.y
            ) *
            smooth;

        camera.position.z +=
            (
                cameraZ -
                camera.position.z
            ) *
            smooth;


        // ====================================================
        // LOOK AT PLAYER
        // ====================================================

        camera.lookAt(
            targetX,
            targetY,
            targetZ
        );
    });


    return null;
}
