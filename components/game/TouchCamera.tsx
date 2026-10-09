"use client";

import {
    useRef,
} from "react";

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
    // CHECK ORIENTATION
    // ========================================================

    function isPortrait() {

        return (
            window.innerHeight >
            window.innerWidth
        );

    }


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


        const screenDeltaX =
            event.clientX -
            lastX.current;

        const screenDeltaY =
            event.clientY -
            lastY.current;


        lastX.current =
            event.clientX;

        lastY.current =
            event.clientY;


        // ====================================================
        // CONVERT SCREEN → GAME
        // ====================================================
        //
        // Landscape:
        //
        // screen X → camera yaw
        // screen Y → camera pitch
        //
        //
        // Portrait:
        //
        // Game đã rotate 90°.
        //
        // Vì vậy:
        //
        // game X = screen Y
        // game Y = -screen X
        //
        // ====================================================

        let deltaX =
            screenDeltaX;

        let deltaY =
            screenDeltaY;


        if (isPortrait()) {

            deltaX =
                screenDeltaY;

            deltaY =
                -screenDeltaX;

        }


        // ====================================================
        // CAMERA STATE
        // ====================================================

        const {
            yaw,
            pitch,
            setRotation,
        } =
            useCameraStore.getState();


        // ====================================================
        // YAW
        // ====================================================

        const nextYaw =
            yaw +
            deltaX *
            SENSITIVITY;


        // ====================================================
        // PITCH
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


        // ====================================================
        // APPLY
        // ====================================================

        setRotation(
            nextYaw,
            nextPitch
        );

    }


    // ========================================================
    // POINTER UP
    // ========================================================

    function handlePointerUp(
        event?: React.PointerEvent<HTMLDivElement>
    ) {

        active.current = false;


        if (
            event &&
            event.currentTarget.hasPointerCapture(
                event.pointerId
            )
        ) {

            event.currentTarget.releasePointerCapture(
                event.pointerId
            );

        }

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

                width: "595%",

                touchAction: "none",

                pointerEvents: "auto",

                zIndex: 10,

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