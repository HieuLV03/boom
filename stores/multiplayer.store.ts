
"use client";

import {
    create,
} from "zustand";

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
            newRoom
        ) => {

            console.log(
                "[STORE] Setting new room:",
                {
                    roomId:
                        newRoom.roomId,

                    sessionId:
                        newRoom.sessionId,
                }
            );


            /*
             * QUAN TRỌNG:
             *
             * Store KHÔNG gọi oldRoom.leave().
             *
             * Việc leave room phải do:
             *
             * - OUT button
             * - disconnect
             * - page lifecycle
             *
             * xử lý.
             *
             * Như vậy tránh việc setRoom()
             * vô tình đóng room đang được sử dụng.
             */


            set({

                room:
                    newRoom,

                hostSessionId:
                    null,

            });

        },


        // ====================================================
        // SET HOST
        // ====================================================

        setHostSessionId: (
            sessionId
        ) => {

            console.log(
                "[STORE] Host session:",
                sessionId
            );


            set({

                hostSessionId:
                    sessionId,

            });

        },


        // ====================================================
        // CLEAR ROOM
        // ====================================================

        clearRoom: () => {

            console.log(
                "[STORE] clearRoom()"
            );


            set({

                room:
                    null,

                hostSessionId:
                    null,

            });

        },

    }));
