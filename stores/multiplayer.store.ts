
"use client";

import { create } from "zustand";
import type { Room } from "@colyseus/sdk";

type MultiplayerStore = {
    room: Room<any> | null;
    hostSessionId: string | null;

    setRoom: (room: Room<any>) => void;
    setHostSessionId: (sessionId: string | null) => void;
    clearRoom: () => void;
};

let activeRoom: Room<any> | null = null;

export const useMultiplayerStore =
    create<MultiplayerStore>((set) => ({
        room: null,
        hostSessionId: null,

        setRoom: (newRoom) => {
            if (activeRoom === newRoom) {
                return;
            }

            activeRoom = newRoom;

            console.log("[STORE] Setting new room:", {
                roomId: newRoom.roomId,
                sessionId: newRoom.sessionId,
                roomName: newRoom.name,
            });

            set({
                room: newRoom,
                hostSessionId: null,
            });

            const syncHost = () => {
                if (activeRoom !== newRoom) return;

                const state = newRoom.state as
                    | { hostId?: string }
                    | undefined;

                const hostId = state?.hostId;

                if (
                    typeof hostId === "string" &&
                    hostId.length > 0
                ) {
                    set({ hostSessionId: hostId });
                }
            };

            syncHost();

            newRoom.onStateChange(() => {
                syncHost();
            });

            newRoom.onMessage(
                "hostChanged",
                (data: { hostId?: string }) => {
                    if (activeRoom !== newRoom) return;

                    if (typeof data?.hostId === "string") {
                        set({
                            hostSessionId: data.hostId,
                        });
                    }
                },
            );
        },

        setHostSessionId: (sessionId) => {
            set({ hostSessionId: sessionId });
        },

        clearRoom: () => {
            console.log("[STORE] clearRoom()");

            activeRoom = null;

            set({
                room: null,
                hostSessionId: null,
            });
        },
    }));
