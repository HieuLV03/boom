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


    // ========================================================
    // SEND BOMB REQUEST TO SERVER
    // ========================================================

    useEffect(() => {

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
         * Đánh dấu request
         * đã được xử lý.
         */
        lastProcessedRequest.current =
            bombRequest;


        /*
         * Chưa connect Colyseus.
         */
        if (!room) {

            console.warn(
                "[CLIENT BOMB] Room chưa sẵn sàng"
            );

            return;
        }


        /*
         * Player chưa tồn tại.
         */
        if (!playerRef.current) {

            console.warn(
                "[CLIENT BOMB] Player chưa sẵn sàng"
            );

            return;
        }


        console.log(
            "[CLIENT BOMB] 💣 Sending plantBomb"
        );

        console.log(
            "[CLIENT BOMB] session:",
            room.sessionId
        );


        /*
         * SERVER sẽ quyết định:
         *
         * - vị trí bomb
         * - countdown
         * - explosion
         * - damage
         * - HP
         */
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
            return;
        }


        const bombs =
            room.state?.bombs;


        if (!bombs) {

            console.warn(
                "[CLIENT BOMB] room.state.bombs không tồn tại"
            );

            return;
        }


        const $ =
            getStateCallbacks(room);


        // ====================================================
        // REFRESH CURRENT BOMB
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

                        /*
                         * Game hiện tại chỉ cho
                         * một bomb client.
                         *
                         * Nếu sau này muốn nhiều bomb,
                         * có thể đổi thành Map.
                         */
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
        // BOMB ADD
        // ====================================================

        const removeAdd =
            $(bombs).onAdd(
                (
                    serverBomb: any
                ) => {

                    console.log(
                        "[CLIENT BOMB] 💣 Bomb received from server:",
                        serverBomb.id
                    );


                    refreshBomb();


                    /*
                     * Theo dõi thay đổi:
                     *
                     * remaining
                     * exploded
                     * position
                     */
                    $(serverBomb).onChange(
                        () => {

                            console.log(
                                "[CLIENT BOMB] Bomb state changed:",
                                serverBomb.id,
                                {
                                    remaining:
                                        serverBomb.remaining,

                                    exploded:
                                        serverBomb.exploded,
                                }
                            );


                            refreshBomb();
                        }
                    );
                }
            );


        // ====================================================
        // BOMB REMOVE
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


                    /*
                     * Nếu bomb bị server xoá,
                     * clear UI.
                     */
                    setBomb(
                        (
                            current
                        ) => {

                            if (
                                !current
                            ) {
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
        // INITIAL STATE
        // ====================================================

        refreshBomb();


        // ====================================================
        // CLEANUP
        // ====================================================

        return () => {

            removeAdd?.();
            removeRemove?.();

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