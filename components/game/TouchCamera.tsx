
"use client";

import { useRef } from "react";

import {
    useCameraStore,
} from "@/stores/camera.store";


// ============================================================
// CAMERA SETTINGS
// ============================================================

const SENSITIVITY = 0.008;

const MIN_PITCH = -0.75;

const MAX_PITCH = 0.35;


// ============================================================
// TOUCH CAMERA
// ============================================================

export default function TouchCamera() {

    const active =
        useRef(false);

    const lastX =
        useRef(0);

    const lastY =
        useRef(0);


    // ========================================================
    // POINTER DOWN
    // ========================================================

    function handlePointerDown(
        event: React.PointerEvent<HTMLDivElement>
    ) {

        active.current = true;

        lastX.current =
            event.clientX;

        lastY.current =
            event.clientY;


        event.currentTarget.setPointerCapture(
            event.pointerId
        );
    }


    // ========================================================
    // POINTER MOVE
    // ========================================================

    function handlePointerMove(
        event: React.PointerEvent<HTMLDivElement>
    ) {

        if (!active.current) {
            return;
        }


        const deltaX =
            event.clientX -
            lastX.current;

        const deltaY =
            event.clientY -
            lastY.current;


        lastX.current =
            event.clientX;

        lastY.current =
            event.clientY;


        const {
            yaw,
            pitch,
            setRotation,
        } =
            useCameraStore.getState();


        // ====================================================
        // CAMERA ROTATION
        //
        // Kéo phải  → nhìn phải
        // Kéo trái  → nhìn trái
        // ====================================================

        let nextYaw =
            yaw +
            deltaX *
            SENSITIVITY;


        // ====================================================
        // CAMERA PITCH
        //
        // Kéo lên   → nhìn lên
        // Kéo xuống → nhìn xuống
        // ====================================================

        let nextPitch =
            pitch +
            deltaY *
            SENSITIVITY;


        nextPitch =
            Math.max(
                MIN_PITCH,
                Math.min(
                    MAX_PITCH,
                    nextPitch
                )
            );


        setRotation(
            nextYaw,
            nextPitch
        );
    }


    // ========================================================
    // POINTER UP
    // ========================================================

    function handlePointerUp() {

        active.current = false;
    }


    // ========================================================
    // UI
    // ========================================================

    return (
        <div
            style={{
                position: "absolute",

                top: 0,
                right: 0,
                bottom: 0,

                width: "55%",

                touchAction: "none",

                pointerEvents: "auto",

                zIndex: 5,

                background: "transparent",
            }}

            onPointerDown={
                handlePointerDown
            }

            onPointerMove={
                handlePointerMove
            }

            onPointerUp={
                handlePointerUp
            }

            onPointerCancel={
                handlePointerUp
            }
        />
    );
}
