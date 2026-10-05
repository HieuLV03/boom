
"use client";

import { create } from "zustand";

type MovementState = {
    x: number;
    y: number;

    setMovement: (
        x: number,
        y: number
    ) => void;

    resetMovement: () => void;
};

export const useMovementStore =
    create<MovementState>((set) => ({
        x: 0,
        y: 0,

        setMovement: (x, y) =>
            set({
                x,
                y,
            }),

        resetMovement: () =>
            set({
                x: 0,
                y: 0,
            }),
    }));
