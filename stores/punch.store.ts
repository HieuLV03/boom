
"use client";

import { create } from "zustand";

type PunchState = {
    punchTrigger: number;
    triggerPunch: () => void;
};

export const usePunchStore = create<PunchState>((set) => ({
    punchTrigger: 0,

    triggerPunch: () =>
        set((state) => ({
            punchTrigger: state.punchTrigger + 1,
        })),
}));
