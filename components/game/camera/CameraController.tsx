"use client";

import {
    useEffect,
    useState,
} from "react";

import {
    useFrame,
    useThree,
} from "@react-three/fiber";

import {
    useCameraStore,
} from "@/stores/camera.store";

import type {
    RefObject,
} from "react";

import type {
    Group,
} from "three";


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

    const {
        camera,
    } = useThree();


    // ========================================================
    // ORIENTATION
    // ========================================================

    const [
        isPortrait,
        setIsPortrait,
    ] = useState(false);


    useEffect(() => {

        function checkOrientation() {

            setIsPortrait(
                window.innerHeight >
                window.innerWidth
            );

        }

        checkOrientation();

        window.addEventListener(
            "resize",
            checkOrientation
        );

        window.addEventListener(
            "orientationchange",
            checkOrientation
        );

        return () => {

            window.removeEventListener(
                "resize",
                checkOrientation
            );

            window.removeEventListener(
                "orientationchange",
                checkOrientation
            );

        };

    }, []);


    // ========================================================
    // FRAME
    // ========================================================

    useFrame((_, delta) => {

        const player =
            target.current;

        if (!player) {
            return;
        }


        const {
            yaw,
            pitch,
        } =
            useCameraStore.getState();


        // ====================================================
        // DISTANCE
        // ====================================================

        const horizontalDistance =
            DISTANCE *
            Math.cos(pitch);


        // ====================================================
        // TARGET
        // ====================================================

        const targetX =
            player.position.x;

        const targetY =
            player.position.y +
            TARGET_HEIGHT;

        const targetZ =
            player.position.z;


        // ====================================================
        // CAMERA POSITION
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
        // SMOOTH POSITION
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
        // LOOK AT
        // ====================================================

        camera.lookAt(
            targetX,
            targetY,
            targetZ
        );


        // ====================================================
        // PORTRAIT CAMERA ROLL
        //
        // Landscape:
        //
        // WORLD Y
        //   ↑
        //   |
        //   |
        //
        //   => screen bottom → top
        //
        //
        // Portrait:
        //
        // WORLD Y
        //   ─────────→
        //
        //   => screen left → right
        //
        // IMPORTANT:
        // We rotate the CAMERA around its viewing axis.
        // We do NOT rotate the map.
        // We do NOT rotate the character.
        // We do NOT change X/Z world coordinates.
        // ====================================================

        if (isPortrait) {

            camera.rotateZ(
                Math.PI / 2
            );

        }

    });


    return null;
}