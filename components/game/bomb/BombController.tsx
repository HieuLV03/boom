"use client";

import {
    useEffect,
    useRef,
    useState,
    type RefObject,
} from "react";

import type { Group } from "three";

import Bomb from "./Bomb";

import {
    useBombStore,
} from "./bomb.store";

import {
    useMultiplayerStore,
} from "@/stores/multiplayer.store";

import {
    getStateCallbacks,
} from "@colyseus/sdk";


// ============================================================
// TYPES
// ============================================================

type BombState = {
    id: string;

    x: number;
    y: number;
    z: number;

    remaining: number;

    exploded: boolean;
};


// ============================================================
// PROPS
// ============================================================

type Props = {
    playerRef: RefObject<Group | null>;
};


// ============================================================
// COMPONENT
// ============================================================

export default function BombController({
    playerRef,
}: Props) {

    // ========================================================
    // BOMB REQUEST
    // ========================================================

    const bombRequest =
        useBombStore(
            (state) =>
                state.bombRequest
        );


    // ========================================================
    // ROOM
    // ========================================================

    const room =
        useMultiplayerStore(
            (state) =>
                state.room
        );


    // ========================================================
    // LOCAL BOMB
    // ========================================================

    const [
        bomb,
        setBomb,
    ] =
        useState<BombState | null>(
            null
        );


    // ========================================================
    // REFS
    // ========================================================

    const lastProcessedRequest =
        useRef(0);

    const lastRoom =
        useRef<any>(null);


    // ========================================================
    // RESET WHEN ROOM CHANGES
    // ========================================================

    useEffect(() => {

        /*
         * Không có room
         */
        if (!room) {

            lastRoom.current = null;

            lastProcessedRequest.current =
                bombRequest;

            setBomb(null);

            return;
        }


        /*
         * Phát hiện room mới
         */
        if (
            lastRoom.current !== room
        ) {

            console.log(
                "[CLIENT BOMB] 🔄 New room detected"
            );

            console.log(
                "[CLIENT BOMB] roomId:",
                room.roomId
            );

            console.log(
                "[CLIENT BOMB] sessionId:",
                room.sessionId
            );

            console.log(
                "[CLIENT BOMB] bombRequest:",
                bombRequest
            );


            /*
             * Lưu room mới
             */
            lastRoom.current =
                room;


            /*
             * Xóa bomb của room cũ
             */
            setBomb(null);


            /*
             * Đồng bộ request cũ.
             *
             * Không gửi bomb ở đây.
             */
            lastProcessedRequest.current =
                bombRequest;

        }

    }, [
        room,
        bombRequest,
    ]);


    // ========================================================
    // SEND BOMB REQUEST
    // ========================================================

    useEffect(() => {

        if (!room) {
            return;
        }


        /*
         * Nếu request chưa thay đổi
         */
        if (
            bombRequest ===
            lastProcessedRequest.current
        ) {
            return;
        }


        /*
         * Player chưa tồn tại.
         *
         * KHÔNG đánh dấu request là processed ở đây.
         *
         * Như vậy nếu player xuất hiện ở render/effect tiếp theo
         * request vẫn có thể được gửi.
         */
        if (!playerRef.current) {

            console.warn(
                "[CLIENT BOMB] Player chưa sẵn sàng"
            );

            return;
        }


        /*
         * Đánh dấu request đã xử lý
         */
        lastProcessedRequest.current =
            bombRequest;


        // ====================================================
        // SEND
        // ====================================================

        console.log(
            "[CLIENT BOMB] 💣 Sending plantBomb"
        );

        console.log(
            "[CLIENT BOMB] roomId:",
            room.roomId
        );

        console.log(
            "[CLIENT BOMB] sessionId:",
            room.sessionId
        );

        console.log(
            "[CLIENT BOMB] request:",
            bombRequest
        );


        room.send(
            "plantBomb"
        );


        console.log(
            "[CLIENT BOMB] ✅ plantBomb sent"
        );

    }, [
        bombRequest,
        room,
        playerRef,
    ]);


    // ========================================================
    // LISTEN BOMB STATE
    // ========================================================

    useEffect(() => {

        if (!room) {

            setBomb(null);

            return;
        }


        const bombs =
            room.state?.bombs;


        if (!bombs) {

            console.warn(
                "[CLIENT BOMB] room.state.bombs không tồn tại"
            );

            setBomb(null);

            return;
        }


        const $ =
            getStateCallbacks(room);


        // ====================================================
        // REFRESH BOMB
        // ====================================================

        const refreshBomb =
            () => {

                let latestBomb:
                    BombState | null =
                    null;


                bombs.forEach(
                    (
                        serverBomb: any
                    ) => {

                        latestBomb = {

                            id:
                                String(
                                    serverBomb.id
                                ),

                            x:
                                Number(
                                    serverBomb.x ??
                                    0
                                ),

                            y:
                                Number(
                                    serverBomb.y ??
                                    0
                                ),

                            z:
                                Number(
                                    serverBomb.z ??
                                    0
                                ),

                            remaining:
                                Number(
                                    serverBomb.remaining ??
                                    0
                                ),

                            exploded:
                                Boolean(
                                    serverBomb.exploded
                                ),

                        };

                    }
                );


                setBomb(
                    latestBomb
                );

            };


        // ====================================================
        // EXISTING BOMBS
        // ====================================================

        bombs.forEach(
            (
                serverBomb: any
            ) => {

                console.log(
                    "[CLIENT BOMB] Existing bomb:",
                    serverBomb.id
                );

            }
        );


        // ====================================================
        // ON ADD
        // ====================================================

        const removeAdd =
            $(bombs).onAdd(
                (
                    serverBomb: any
                ) => {

                    console.log(
                        "[CLIENT BOMB] 💣 Bomb received:",
                        serverBomb.id
                    );


                    /*
                     * Refresh ngay khi server add bomb.
                     */
                    refreshBomb();


                    /*
                     * Theo dõi thay đổi bomb.
                     */
                    $(serverBomb).onChange(
                        () => {

                            console.log(
                                "[CLIENT BOMB] Bomb changed:",
                                serverBomb.id,
                                {
                                    remaining:
                                        serverBomb.remaining,

                                    exploded:
                                        serverBomb.exploded,

                                    x:
                                        serverBomb.x,

                                    y:
                                        serverBomb.y,

                                    z:
                                        serverBomb.z,
                                }
                            );


                            refreshBomb();

                        }
                    );

                }
            );


        // ====================================================
        // ON REMOVE
        // ====================================================

        const removeRemove =
            $(bombs).onRemove(
                (
                    serverBomb: any
                ) => {

                    console.log(
                        "[CLIENT BOMB] 💨 Bomb removed:",
                        serverBomb.id
                    );


                    setBomb(
                        (
                            current
                        ) => {

                            if (!current) {
                                return null;
                            }


                            if (
                                current.id ===
                                String(
                                    serverBomb.id
                                )
                            ) {

                                return null;

                            }


                            return current;

                        }
                    );

                }
            );


        // ====================================================
        // INITIAL
        // ====================================================

        refreshBomb();


        // ====================================================
        // CLEANUP
        // ====================================================

        return () => {

            removeAdd?.();

            removeRemove?.();

            setBomb(null);

        };

    }, [
        room,
    ]);


    // ========================================================
    // RENDER
    // ========================================================

    if (!bomb) {
        return null;
    }


    return (
        <Bomb
            position={[
                bomb.x,
                bomb.y,
                bomb.z,
            ]}
            remaining={
                bomb.remaining
            }
            exploded={
                bomb.exploded
            }
        />
    );
}