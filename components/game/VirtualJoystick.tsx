
"use client";

import { useRef, useState } from "react";

import {
    useMovementStore,
} from "@/stores/movement.store";

export default function VirtualJoystick() {

    const [position, setPosition] =
        useState({
            x: 0,
            y: 0,
        });

    const active =
        useRef(false);


    // ============================================================
    // STORE
    // ============================================================

    const setMovement =
        useMovementStore(
            (state) => state.setMovement
        );

    const resetMovement =
        useMovementStore(
            (state) => state.resetMovement
        );


    // ============================================================
    // UPDATE JOYSTICK
    // ============================================================

    function updateJoystick(
        clientX: number,
        clientY: number,
        element: HTMLDivElement
    ) {

        const rect =
            element.getBoundingClientRect();


        const centerX =
            rect.left +
            rect.width / 2;

        const centerY =
            rect.top +
            rect.height / 2;


        const dx =
            clientX - centerX;

        const dy =
            clientY - centerY;


        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        const maxDistance = 45;


        const scale =
            distance > maxDistance
                ? maxDistance / distance
                : 1;


        const x =
            dx * scale;

        const y =
            dy * scale;


        setPosition({
            x,
            y,
        });


        // ========================================================
        // NORMALIZE
        // ========================================================

        const normalizedX =
            x / maxDistance;

        const normalizedY =
            y / maxDistance;


        setMovement(
            normalizedX,
            normalizedY
        );
    }


    // ============================================================
    // POINTER DOWN
    // ============================================================

    function start(
        event: React.PointerEvent<HTMLDivElement>
    ) {

        active.current = true;


        event.currentTarget.setPointerCapture(
            event.pointerId
        );


        updateJoystick(
            event.clientX,
            event.clientY,
            event.currentTarget
        );
    }


    // ============================================================
    // POINTER MOVE
    // ============================================================

    function move(
        event: React.PointerEvent<HTMLDivElement>
    ) {

        if (!active.current) {
            return;
        }


        updateJoystick(
            event.clientX,
            event.clientY,
            event.currentTarget
        );
    }


    // ============================================================
    // POINTER END
    // ============================================================

    function end() {

        active.current = false;


        setPosition({
            x: 0,
            y: 0,
        });


        resetMovement();
    }


    // ============================================================
    // UI
    // ============================================================

    return (
        <div
            style={{
                position: "absolute",

                left: 24,

                bottom: 80,

                width: 130,

                height: 130,

                borderRadius: "50%",

                background:
                    "rgba(255,255,255,.12)",

                border:
                    "2px solid rgba(255,255,255,.25)",

                touchAction: "none",

                pointerEvents: "auto",

                userSelect: "none",
            }}

            onPointerDown={start}

            onPointerMove={move}

            onPointerUp={end}

            onPointerCancel={end}

            onPointerLeave={(event) => {

                if (
                    active.current &&
                    event.currentTarget.hasPointerCapture(
                        event.pointerId
                    )
                ) {
                    return;
                }
            }}
        >

            <div
                style={{
                    position: "absolute",

                    left: "50%",

                    top: "50%",

                    width: 58,

                    height: 58,

                    borderRadius: "50%",

                    background:
                        "rgba(255,255,255,.45)",

                    boxShadow:
                        "0 4px 15px rgba(0,0,0,.3)",

                    transform: `
                        translate(
                            calc(-50% + ${position.x}px),
                            calc(-50% + ${position.y}px)
                        )
                    `,
                }}
            />

        </div>
    );
}
