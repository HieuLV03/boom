"use client";

import { create } from "zustand";
import type { Room } from "@colyseus/sdk";


// ============================================================
// STORE TYPE
// ============================================================

type MultiplayerStore = {

    room: Room<any> | null;

    setRoom: (
        room: Room<any>
    ) => void;

    clearRoom: () => void;

};


// ============================================================
// STORE
// ============================================================

export const useMultiplayerStore =
    create<MultiplayerStore>((set) => ({

        room: null,

        setRoom: (room) => {

            set({
                room,
            });

        },

        clearRoom: () => {

            set({
                room: null,
            });

        },

    }));