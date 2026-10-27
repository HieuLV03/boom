
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

export const useMultiplayerStore =
    create<MultiplayerStore>((set) => ({
        room: null,
        hostSessionId: null,

        setRoom: (newRoom) => {
            console.log("[STORE] Setting new room:", {
                roomId: newRoom.roomId,
                sessionId: newRoom.sessionId,
            });

            set({
                room: newRoom,
                hostSessionId: null,
            });

            // Đồng bộ chủ phòng từ state của server.
            const syncHost = () => {
                const state = newRoom.state as
                    | { hostId?: string }
                    | undefined;

                const hostId = state?.hostId;

                if (typeof hostId === "string" && hostId.length > 0) {
                    set({ hostSessionId: hostId });

                    console.log("[STORE] Synced host:", hostId);
                }
            };

            // Đồng bộ ngay nếu state đã có dữ liệu.
            syncHost();

            // Đồng bộ tiếp khi server cập nhật state.
            newRoom.onStateChange(() => {
                syncHost();
            });

            // Theo dõi thông điệp hostChanged nếu server gửi.
            newRoom.onMessage("hostChanged", (data: {
                hostId?: string;
            }) => {
                if (typeof data?.hostId === "string") {
                    set({ hostSessionId: data.hostId });

                    console.log(
                        "[STORE] Host changed:",
                        data.hostId
                    );
                }
            });
        },

        setHostSessionId: (sessionId) => {
            console.log("[STORE] Host session:", sessionId);
            set({ hostSessionId: sessionId });
        },

        clearRoom: () => {
            console.log("[STORE] clearRoom()");

            set({
                room: null,
                hostSessionId: null,
            });
        },
    }));
