import { create } from "zustand";

type WeaponStore = {
    nearbyPickupId: string | null;
    equippedSlot: number;
    weapon1: string;
    weapon2: string;

    pickupRequest: number;
    attackRequest: number;
    switchRequest: number;

    attackAction: "punch" | "shoot";
    requestedSlot: number;

    setNearbyPickupId: (id: string | null) => void;
    setWeaponState: (
        weapon1: string,
        weapon2: string,
        equippedSlot: number,
    ) => void;

    requestPickup: () => void;
    requestAttack: (action: "punch" | "shoot") => void;
    requestSwitch: (slot: number) => void;
};

export const useWeaponStore = create<WeaponStore>((set) => ({
    nearbyPickupId: null,
    equippedSlot: 0,
    weapon1: "",
    weapon2: "",

    pickupRequest: 0,
    attackRequest: 0,
    switchRequest: 0,

    attackAction: "punch",
    requestedSlot: 0,

    setNearbyPickupId: (id) => set({ nearbyPickupId: id }),

    setWeaponState: (weapon1, weapon2, equippedSlot) =>
        set({ weapon1, weapon2, equippedSlot }),

    requestPickup: () =>
        set((state) => ({
            pickupRequest: state.pickupRequest + 1,
        })),

    requestAttack: (action) =>
        set((state) => ({
            attackAction: action,
            attackRequest: state.attackRequest + 1,
        })),

    requestSwitch: (slot) =>
        set((state) => ({
            requestedSlot: slot,
            switchRequest: state.switchRequest + 1,
        })),
}));