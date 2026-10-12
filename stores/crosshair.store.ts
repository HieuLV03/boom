
import { create } from "zustand";

type CrosshairState = {
    x: number;
    y: number;
    visible: boolean;

    setPosition: (
        x: number,
        y: number,
        visible: boolean,
    ) => void;
};

export const useCrosshairStore =
    create<CrosshairState>((set) => ({
        x: 0.5,
        y: 0.5,
        visible: false,

        setPosition: (x, y, visible) =>
            set((state) => {
                // Tránh render lại nếu vị trí hầu như không đổi.
                if (
                    Math.abs(state.x - x) < 0.001 &&
                    Math.abs(state.y - y) < 0.001 &&
                    state.visible === visible
                ) {
                    return state;
                }

                return { x, y, visible };
            }),
    }));
