
import { create } from "zustand";

type CameraViewState = {
    firstPerson: boolean;
    setFirstPerson: (value: boolean) => void;
};

export const useCameraViewStore = create<CameraViewState>((set) => ({
    firstPerson: false,
    setFirstPerson: (value) => set({ firstPerson: value }),
}));
