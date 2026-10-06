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

    /*
     * Request cuối cùng đã xử lý.
     */
    const lastProcessedRequest =
        useRef(0);


    /*
     * Room hiện tại.
     *
     * Dùng để phát hiện khi người chơi
     * vào một trận mới.
     */
    const lastRoom =
        useRef<any>(null);


    // ========================================================
    // SEND BOMB REQUEST TO SERVER
    // ========================================================

    useEffect(() => {

        /*
         * ====================================================
         * KHÔNG CÓ ROOM
         * ====================================================
         */

        if (!room) {
            return;
        }


        /*
         * ====================================================
         * ROOM MỚI
         * ====================================================
         *
         * Đây là phần quan trọng nhất.
         *
         * Khi vào trận mới, bombRequest có thể vẫn giữ
         * giá trị của trận trước.
         *
         * Ví dụ:
         *
         * trận cũ:
         * bombRequest = 1
         *
         * trận mới:
         * bombRequest vẫn = 1
         *
         * Nếu lastProcessedRequest = 0 thì component
         * sẽ hiểu nhầm đây là request mới.
         *
         * Vì vậy khi phát hiện room mới, chúng ta đồng bộ
         * lastProcessedRequest với bombRequest hiện tại.
         */

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
             * Đánh dấu request cũ là đã xử lý.
             *
             * KHÔNG gửi plantBomb ở đây.
             */
            lastProcessedRequest.current =
                bombRequest;


            /*
             * Lưu room hiện tại.
             */
            lastRoom.current =
                room;


            /*
             * Xóa bomb UI cũ nếu có.
             */
            setBomb(null);


            return;
        }


        /*
         * ====================================================
         * KHÔNG CÓ REQUEST MỚI
         * ====================================================
         */

        if (
            bombRequest ===
            lastProcessedRequest.current
        ) {
            return;
        }


        /*
         * ====================================================
         * ĐÁNH DẤU REQUEST
         * ====================================================
         */

        lastProcessedRequest.current =
            bombRequest;


        /*
         * ====================================================
         * PLAYER CHƯA SẴN SÀNG
         * ====================================================
         */

        if (!playerRef.current) {

            console.warn(
                "[CLIENT BOMB] Player chưa sẵn sàng"
            );

            return;
        }


        /*
         * ====================================================
         * SEND TO SERVER
         * ====================================================
         */

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

            /*
             * Khi rời room, xóa bomb khỏi UI.
             */
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