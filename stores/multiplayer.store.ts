
"use client";

import { create } from "zustand";

import type {
    Room,
} from "@colyseus/sdk";


// ============================================================
// STORE TYPE
// ============================================================

type MultiplayerStore = {

    room:
        Room<any> | null;

    hostSessionId:
        string | null;

    setRoom: (
        room: Room<any>
    ) => void;

    setHostSessionId: (
        sessionId: string | null
    ) => void;

    clearRoom: () => void;

};


// ============================================================
// STORE
// ============================================================

export const useMultiplayerStore =
    create<MultiplayerStore>((set) => ({

        room:
            null,

        hostSessionId:
            null,


        // ====================================================
        // SET ROOM
        // ====================================================

        setRoom: (
            room
        ) => {

            set({
                room,
            });

        },


        // ====================================================
        // SET HOST
        // ====================================================

        setHostSessionId: (
            sessionId
        ) => {

            set({
                hostSessionId:
                    sessionId,
            });

        },


        // ====================================================
        // CLEAR ROOM
        // ====================================================

        clearRoom: () => {

            set({
                room:
                    null,

                hostSessionId:
                    null,
            });

        },

    }));
