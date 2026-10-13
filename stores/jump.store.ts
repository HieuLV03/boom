
import { create } from "zustand";

type JumpStore = {
    jumpTrigger: number;
    triggerJump: () => void;
};

export const useJumpStore = create<JumpStore>((set) => ({
    jumpTrigger: 0,

    triggerJump: () =>
        set((state) => ({
            jumpTrigger: state.jumpTrigger + 1,
        })),
}));
