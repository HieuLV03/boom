
"use client";

import { useRef, useState } from "react";
import type { PointerEvent } from "react";

import { useMovementStore } from "@/stores/movement.store";

import "./VirtualJoystick.css";

type JoystickPosition = {
    x: number;
    y: number;
};

const MAX_DISTANCE = 45;

export default function VirtualJoystick() {
    const [position, setPosition] = useState<JoystickPosition>({
        x: 0,
        y: 0,
    });

    const active = useRef(false);

    const setMovement = useMovementStore(
        (state) => state.setMovement
    );

    const resetMovement = useMovementStore(
        (state) => state.resetMovement
    );

    function updateJoystick(
        clientX: number,
        clientY: number,
        element: HTMLDivElement
    ) {
        const rect = element.getBoundingClientRect();

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dx = clientX - centerX;
        const dy = clientY - centerY;

        const distance = Math.sqrt(dx * dx + dy * dy);

        const scale =
            distance > MAX_DISTANCE
                ? MAX_DISTANCE / distance
                : 1;

        const x = dx * scale;
        const y = dy * scale;

        setPosition({ x, y });

        const normalizedX = x / MAX_DISTANCE;
        const normalizedY = y / MAX_DISTANCE;

        // Trả input thô; LocalPlayerController xử lý hướng di chuyển.
        setMovement(normalizedX, normalizedY);
    }

    function start(event: PointerEvent<HTMLDivElement>) {
        active.current = true;

        event.currentTarget.setPointerCapture(event.pointerId);

        updateJoystick(
            event.clientX,
            event.clientY,
            event.currentTarget
        );
    }

    function move(event: PointerEvent<HTMLDivElement>) {
        if (!active.current) return;

        updateJoystick(
            event.clientX,
            event.clientY,
            event.currentTarget
        );
    }

    function end(event: PointerEvent<HTMLDivElement>) {
        active.current = false;

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }

        setPosition({ x: 0, y: 0 });
        resetMovement();
    }

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
                    transform: `translate(
                        calc(-50% + ${position.x}px),
                        calc(-50% + ${position.y}px)
                    )`,
                }}
            />
        </div>
    );
}
