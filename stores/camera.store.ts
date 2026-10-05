
"use client";

import { create } from "zustand";

type CameraState = {
    yaw: number;
    pitch: number;

    setRotation: (
        yaw: number,
        pitch: number
    ) => void;
};

export const useCameraStore =
    create<CameraState>((set) => ({
        yaw: 0,
        pitch: -0.15,

        setRotation: (
            yaw,
            pitch
        ) =>
            set({
                yaw,
                pitch,
            }),
    }));
