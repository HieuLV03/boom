
"use client";

import { create } from "zustand";

type AimVector = {
    x: number;
    y: number;
    z: number;
};

type AimStore = {
    origin: AimVector;
    direction: AimVector;
    setAim: (
        origin: AimVector,
        direction: AimVector,
    ) => void;
};

export const useAimStore = create<AimStore>((set) => ({
    origin: { x: 0, y: 0, z: 0 },
    direction: { x: 0, y: 0, z: -1 },

    setAim: (origin, direction) => {
        set({ origin, direction });
    },
}));
