
"use client";

import { useRef } from "react";
import { useCameraStore } from "@/stores/camera.store";
import type { PointerEvent } from "react";

// ============================================================
// CAMERA SETTINGS
// ============================================================

const SENSITIVITY = 0.008;

const MIN_PITCH = -1.45;
const MAX_PITCH = 1.52;

// ============================================================
// TOUCH CAMERA
// ============================================================

export default function TouchCamera() {
    const active = useRef(false);
    const lastX = useRef(0);
    const lastY = useRef(0);

    // ========================================================
    // POINTER DOWN
    // ========================================================

    function handlePointerDown(
        event: PointerEvent<HTMLDivElement>
    ) {
        active.current = true;

        lastX.current = event.clientX;
        lastY.current = event.clientY;

        event.currentTarget.setPointerCapture(
            event.pointerId
        );
    }

    // ========================================================
    // POINTER MOVE
    // ========================================================

    function handlePointerMove(
        event: PointerEvent<HTMLDivElement>
    ) {
        if (!active.current) return;

        // Tính độ dịch chuyển trên màn hình ngang.
        const deltaX = event.clientX - lastX.current;
        const deltaY = event.clientY - lastY.current;

        lastX.current = event.clientX;
        lastY.current = event.clientY;

        // Lấy trạng thái camera hiện tại.
        const {
            yaw,
            pitch,
            setRotation,
        } = useCameraStore.getState();

        // Vuốt ngang để xoay camera trái/phải.
        const nextYaw =
            yaw + deltaX * SENSITIVITY;

        // Vuốt dọc để nhìn lên/xuống.
        const nextPitch = Math.max(
            MIN_PITCH,
            Math.min(
                MAX_PITCH,
                pitch + deltaY * SENSITIVITY
            )
        );

        // Cập nhật camera.
        setRotation(nextYaw, nextPitch);
    }

    // ========================================================
    // POINTER UP
    // ========================================================

    function handlePointerUp(
        event?: PointerEvent<HTMLDivElement>
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
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
        />
    );
}
