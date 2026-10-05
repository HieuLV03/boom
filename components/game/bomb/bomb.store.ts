
"use client";

import { create } from "zustand";

type BombStore = {
    bombRequest: number;

    requestBomb: () => void;
};

export const useBombStore =
    create<BombStore>((set) => ({
        bombRequest: 0,

        requestBomb: () =>
            set((state) => ({
                bombRequest:
                    state.bombRequest + 1,
            })),
    }));
