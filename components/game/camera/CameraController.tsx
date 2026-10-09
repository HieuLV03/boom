
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

import {
    Quaternion,
    Vector3,
} from "three";

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

// Khoảng cách camera đến nhân vật
const DISTANCE = 7;

// Độ cao camera
const HEIGHT = 3;

// Camera nhìn vào vị trí này trên nhân vật
const TARGET_HEIGHT = 1.1;

// Tốc độ camera bám theo nhân vật
const SMOOTH_SPEED = 10;


// ============================================================
// FOV SETTINGS
// ============================================================

// Điện thoại nằm ngang
const LANDSCAPE_FOV = 65;

// Điện thoại dựng dọc
const PORTRAIT_FOV = 85;


// ============================================================
// CAMERA CONTROLLER
// ============================================================

export default function CameraController({
    target,
}: Props) {

    const { camera } = useThree();

    const [
        isPortrait,
        setIsPortrait,
    ] = useState(false);


    // Lưu hướng nhìn cơ sở trước khi xoay camera
    const baseQuaternion = new Quaternion();

    // Quaternion xoay camera 90 độ quanh trục nhìn
    const rollQuaternion = new Quaternion();

    const rollAxis = new Vector3(0, 0, 1);


    // ========================================================
    // ORIENTATION + FOV
    // ========================================================

    useEffect(() => {

        function updateCamera() {

            const portrait =
                window.innerHeight >
                window.innerWidth;

            setIsPortrait(portrait);

            if ("fov" in camera) {

                camera.fov = portrait
                    ? PORTRAIT_FOV
                    : LANDSCAPE_FOV;

                camera.updateProjectionMatrix();

            }
        }

        updateCamera();

        window.addEventListener(
            "resize",
            updateCamera
        );

        window.addEventListener(
            "orientationchange",
            updateCamera
        );

        return () => {

            window.removeEventListener(
                "resize",
                updateCamera
            );

            window.removeEventListener(
                "orientationchange",
                updateCamera
            );

        };

    }, [camera]);


    // ========================================================
    // FRAME
    // ========================================================

    useFrame((_, delta) => {

        const player = target.current;

        if (!player) {
            return;
        }

        const { yaw, pitch } =
            useCameraStore.getState();


        // ====================================================
        // DISTANCE
        // ====================================================

        const horizontalDistance =
            DISTANCE * Math.cos(pitch);


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
            1 - Math.exp(
                -SMOOTH_SPEED * delta
            );

        camera.position.x +=
            (cameraX - camera.position.x) *
            smooth;

        camera.position.y +=
            (cameraY - camera.position.y) *
            smooth;

        camera.position.z +=
            (cameraZ - camera.position.z) *
            smooth;


        // ====================================================
        // LOOK AT
        // ====================================================

        camera.up.set(0, 1, 0);

        camera.lookAt(
            targetX,
            targetY,
            targetZ
        );


        // ====================================================
        // PORTRAIT CAMERA ROLL
        // ====================================================

        if (isPortrait) {

            // Lưu hướng nhìn vừa được lookAt tính toán
            baseQuaternion.copy(camera.quaternion);

            // Xoay 90 độ quanh trục nhìn của camera
            rollAxis
                .set(0, 0, 1)
                .applyQuaternion(baseQuaternion)
                .normalize();

            rollQuaternion.setFromAxisAngle(
                rollAxis,
                Math.PI / 2
            );

            camera.quaternion
                .copy(rollQuaternion)
                .multiply(baseQuaternion);

        }

    });


    return null;
}
