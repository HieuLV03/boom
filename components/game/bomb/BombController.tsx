
"use client";

import {
    useEffect,
    useRef,
    useState,
    type RefObject,
} from "react";

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

import type { Group } from "three";


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
    // STATE
    // ========================================================

    const [
        bombs,
        setBombs,
    ] =
        useState<
            Map<string, BombState>
        >(
            () =>
                new Map()
        );


    // ========================================================
    // REFS
    // ========================================================

    const lastProcessedRequest =
        useRef<number>(
            0
        );


    /*
     * Room mà request cuối cùng đã được
     * xử lý thuộc về.
     */

    const requestRoomRef =
        useRef<string | null>(
            null
        );


    // ========================================================
    // ROOM CHANGED
    // ========================================================

    useEffect(() => {

        if (!room) {

            console.log(
                "[CLIENT BOMB] ❌ No room"
            );


            setBombs(
                new Map()
            );


            requestRoomRef.current =
                null;


            return;

        }


        console.log(
            "========================================"
        );

        console.log(
            "[CLIENT BOMB] 🔄 Connected to room"
        );

        console.log(
            "[CLIENT BOMB] roomId:",
            room.roomId
        );

        console.log(
            "[CLIENT BOMB] sessionId:",
            room.sessionId
        );


        /*
         * Đây là room mới.
         *
         * Không giữ bomb của room cũ.
         */

        setBombs(
            new Map()
        );


        /*
         * Đánh dấu request hiện tại đã tồn tại
         * trước khi vào room này.
         *
         * Request tiếp theo sẽ được gửi.
         */

        lastProcessedRequest.current =
            bombRequest;


        requestRoomRef.current =
            room.roomId;


        // ====================================================
        // SERVER BOMBS
        // ====================================================

        const serverBombs =
            room.state?.bombs;


        if (!serverBombs) {

            console.warn(
                "[CLIENT BOMB] ❌ room.state.bombs not ready"
            );

            return;

        }


        const $ =
            getStateCallbacks(
                room
            );


        // ====================================================
        // CONVERT
        // ====================================================

        const convertBomb =
            (
                serverBomb: any
            ): BombState => {

                return {

                    id:
                        String(
                            serverBomb.id
                        ),

                    x:
                        Number(
                            serverBomb.x ?? 0
                        ),

                    y:
                        Number(
                            serverBomb.y ?? 0
                        ),

                    z:
                        Number(
                            serverBomb.z ?? 0
                        ),

                    remaining:
                        Number(
                            serverBomb.remaining ?? 0
                        ),

                    exploded:
                        Boolean(
                            serverBomb.exploded
                        ),

                };

            };


        // ====================================================
        // UPDATE
        // ====================================================

        const updateBomb =
            (
                serverBomb: any
            ) => {

                const converted =
                    convertBomb(
                        serverBomb
                    );


                setBombs(
                    (
                        current
                    ) => {

                        const next =
                            new Map(
                                current
                            );


                        next.set(
                            converted.id,
                            converted
                        );


                        return next;

                    }
                );

            };


        // ====================================================
        // REMOVE
        // ====================================================

        const removeBomb =
            (
                serverBomb: any
            ) => {

                const id =
                    String(
                        serverBomb.id
                    );


                setBombs(
                    (
                        current
                    ) => {

                        if (
                            !current.has(id)
                        ) {

                            return current;

                        }


                        const next =
                            new Map(
                                current
                            );


                        next.delete(
                            id
                        );


                        return next;

                    }
                );

            };


        // ====================================================
        // EXISTING BOMBS
        // ====================================================

        serverBombs.forEach(
            (
                serverBomb: any
            ) => {

                console.log(
                    "[CLIENT BOMB] Existing bomb:",
                    serverBomb.id
                );


                updateBomb(
                    serverBomb
                );

            }
        );


        // ====================================================
        // BOMB ADDED
        // ====================================================

        const removeAdd =
            $(serverBombs).onAdd(
                (
                    serverBomb: any
                ) => {

                    console.log(
                        "[CLIENT BOMB] 💣 Bomb received:",
                        {
                            roomId:
                                room.roomId,

                            sessionId:
                                room.sessionId,

                            bombId:
                                serverBomb.id,

                            owner:
                                serverBomb.ownerId,
                        }
                    );


                    updateBomb(
                        serverBomb
                    );


                    // ========================================
                    // BOMB CHANGED
                    // ========================================

                    $(
                        serverBomb
                    ).onChange(
                        () => {

                            updateBomb(
                                serverBomb
                            );

                        }
                    );

                }
            );


        // ====================================================
        // BOMB REMOVED
        // ====================================================

        const removeRemove =
            $(serverBombs).onRemove(
                (
                    serverBomb: any
                ) => {

                    console.log(
                        "[CLIENT BOMB] 💨 Bomb removed:",
                        serverBomb.id
                    );


                    removeBomb(
                        serverBomb
                    );

                }
            );


        // ====================================================
        // CLEANUP
        // ====================================================

        return () => {

            console.log(
                "[CLIENT BOMB] 🧹 Cleaning room:",
                {
                    roomId:
                        room.roomId,

                    sessionId:
                        room.sessionId,
                }
            );


            removeAdd?.();

            removeRemove?.();


            setBombs(
                new Map()
            );

        };

    }, [
        room,
    ]);


    // ========================================================
    // SEND BOMB REQUEST
    // ========================================================

    useEffect(() => {

        if (!room) {
            return;
        }


        /*
         * Nếu đây là room mới thì không gửi
         * request cũ.
         */

        if (
            requestRoomRef.current !==
            room.roomId
        ) {

            requestRoomRef.current =
                room.roomId;


            lastProcessedRequest.current =
                bombRequest;


            return;

        }


        /*
         * Không có request mới.
         */

        if (
            bombRequest ===
            lastProcessedRequest.current
        ) {

            return;

        }


        /*
         * Player chưa sẵn sàng.
         *
         * KHÔNG đánh dấu request đã xử lý.
         * Khi player sẵn sàng effect sẽ chạy lại
         * nếu request thay đổi.
         */

        if (!playerRef.current) {

            console.warn(
                "[CLIENT BOMB] ⚠️ Player chưa sẵn sàng"
            );

            return;

        }


        // ====================================================
        // MARK PROCESSED
        // ====================================================

        lastProcessedRequest.current =
            bombRequest;


        // ====================================================
        // SEND
        // ====================================================

        console.log(
            "========================================"
        );

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
    // RENDER
    // ========================================================

    if (
        bombs.size === 0
    ) {

        return null;

    }


    return (

        <>

            {
                Array.from(
                    bombs.values()
                ).map(
                    (
                        bomb
                    ) => (

                        <Bomb

                            key={
                                bomb.id
                            }

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

                    )
                )
            }

        </>

    );

}
