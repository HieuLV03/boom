"use client";

import { create } from "zustand";

type AimingState = {
    aiming: boolean;
    setAiming: (aiming: boolean) => void;
};

export const useAimingStore = create<AimingState>((set) => ({
    aiming: false,

    setAiming: (aiming) => set({ aiming }),
}));