
"use client";

import {
    useRef,
    useState,
} from "react";

import {
    useMovementStore,
} from "@/stores/movement.store";

import "./VirtualJoystick.css";


// ============================================================
// TYPES
// ============================================================

type JoystickPosition = {
    x: number;
    y: number;
};


// ============================================================
// COMPONENT
// ============================================================

export default function VirtualJoystick() {

    const [position, setPosition] =
        useState<JoystickPosition>({
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

    function end(
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
            className="virtual-joystick"

            onPointerDown={start}

            onPointerMove={move}

            onPointerUp={end}

            onPointerCancel={end}
        >

            <div
                className="virtual-joystick-knob"

                style={{
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
