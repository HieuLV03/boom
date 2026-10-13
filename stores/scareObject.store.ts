
import { create } from "zustand";

type ScareObjectStore = {
    hp: number;
    isHit: boolean;
    setHp: (hp: number) => void;
    reset: () => void;
};

export const useScareObjectStore = create<ScareObjectStore>(
    (set) => ({
        hp: 100,
        isHit: false,

        setHp: (hp) =>
            set({
                hp: Math.max(0, Math.min(100, hp)),
                isHit: true,
            }),

        reset: () => set({ hp: 100, isHit: false }),
    }),
);
