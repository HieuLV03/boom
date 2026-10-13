
import { create } from "zustand";

type CrouchStore = {
    crouching: boolean;
    setCrouching: (value: boolean) => void;
    toggleCrouch: () => void;
};

export const useCrouchStore = create<CrouchStore>((set) => ({
    crouching: false,

    setCrouching: (value) =>
        set({ crouching: value }),

    toggleCrouch: () =>
        set((state) => ({
            crouching: !state.crouching,
        })),
}));
