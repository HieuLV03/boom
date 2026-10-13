
"use client";

import { create } from "zustand";

type RunState = {
    running: boolean;
    setRunning: (running: boolean) => void;
};

export const useRunStore = create<RunState>((set) => ({
    running: false,

    setRunning: (running) => set({ running }),
}));
