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
    // COLYSEUS ROOM
    // ========================================================

    const room =
        useMultiplayerStore(
            (state) =>
                state.room
        );


    // ========================================================
    // STATE
    // ========================================================

    /*
     * QUAN TRỌNG:
     *
     * Không còn:
     *
     *     bomb: BombState | null
     *
     * Mà dùng Map:
     *
     *     bombId -> BombState
     *
     * Ví dụ:
     *
     *     A -> bomb player 1
     *     B -> bomb player 2
     *     C -> bomb player 1
     */

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

    /*
     * Request cuối cùng đã xử lý.
     */

    const lastProcessedRequest =
        useRef(0);


    /*
     * Room hiện tại.
     */

    const lastRoom =
        useRef<any>(null);


    // ========================================================
    // SEND BOMB REQUEST TO SERVER
    // ========================================================

    useEffect(() => {

        if (!room) {
            return;
        }


        // ====================================================
        // NEW ROOM
        // ====================================================

        if (
            lastRoom.current !== room
        ) {

            console.log(
                "[CLIENT BOMB] 🔄 New room detected"
            );

            console.log(
                "[CLIENT BOMB] Current bombRequest:",
                bombRequest
            );


            /*
             * Không gửi request cũ.
             */

            lastProcessedRequest.current =
                bombRequest;


            lastRoom.current =
                room;


            /*
             * Xóa toàn bộ bomb của room cũ.
             */

            setBombs(
                new Map()
            );


            return;

        }


        // ====================================================
        // NO NEW REQUEST
        // ====================================================

        if (
            bombRequest ===
            lastProcessedRequest.current
        ) {

            return;

        }


        // ====================================================
        // MARK REQUEST PROCESSED
        // ====================================================

        lastProcessedRequest.current =
            bombRequest;


        // ====================================================
        // PLAYER NOT READY
        // ====================================================

        if (!playerRef.current) {

            console.warn(
                "[CLIENT BOMB] Player chưa sẵn sàng"
            );

            return;

        }


        // ====================================================
        // SEND TO SERVER
        // ====================================================

        console.log(
            "[CLIENT BOMB] 💣 Sending plantBomb"
        );

        console.log(
            "[CLIENT BOMB] session:",
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
    // LISTEN COLYSEUS BOMB STATE
    // ========================================================

    useEffect(() => {

        if (!room) {

            setBombs(
                new Map()
            );

            return;

        }


        const serverBombs =
            room.state?.bombs;


        if (!serverBombs) {

            console.warn(
                "[CLIENT BOMB] room.state.bombs không tồn tại"
            );

            setBombs(
                new Map()
            );

            return;

        }


        const $ =
            getStateCallbacks(room);


        // ====================================================
        // CONVERT SERVER BOMB
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
        // SET / UPDATE BOMB
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
        // REMOVE BOMB
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
        // BOMB ADD
        // ====================================================

        const removeAdd =
            $(serverBombs).onAdd(
                (
                    serverBomb: any
                ) => {

                    console.log(
                        "[CLIENT BOMB] 💣 Bomb received:",
                        serverBomb.id
                    );


                    /*
                     * Thêm bomb mới.
                     */

                    updateBomb(
                        serverBomb
                    );


                    // ========================================
                    // LISTEN BOMB CHANGES
                    // ========================================

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
                                }
                            );


                            updateBomb(
                                serverBomb
                            );

                        }
                    );

                }
            );


        // ====================================================
        // BOMB REMOVE
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

            removeAdd?.();

            removeRemove?.();


            /*
             * Xóa toàn bộ bomb khi room thay đổi.
             */

            setBombs(
                new Map()
            );

        };

    }, [
        room,
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