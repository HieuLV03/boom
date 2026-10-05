
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

type BombState = {
    id: number;

    position: [
        number,
        number,
        number,
    ];

    remaining: number;

    exploded: boolean;
};

type Props = {
    playerRef: RefObject<Group | null>;
};


// ============================================================
// CONFIG
// ============================================================

const FUSE_TIME = 3;

const EXPLOSION_TIME = 650;


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
    // STATE
    // ========================================================

    const [bomb, setBomb] =
        useState<BombState | null>(
            null
        );


    // ========================================================
    // REFS
    // ========================================================

    const lastProcessedRequest =
        useRef(0);

    const timerRef =
        useRef<number | null>(null);

    const explosionTimerRef =
        useRef<number | null>(null);

    const bombId =
        useRef(0);


    // ========================================================
    // PLACE BOMB
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
         * Đánh dấu request này
         * đã được xử lý.
         *
         * Rất quan trọng:
         * request cũ sẽ không bao giờ
         * được xử lý lại.
         */
        lastProcessedRequest.current =
            bombRequest;


        /*
         * Nếu đang có bomb
         * thì không đặt thêm.
         */
        if (bomb !== null) {
            return;
        }


        const player =
            playerRef.current;

        if (!player) {
            return;
        }


        // ====================================================
        // BOMB POSITION
        // ====================================================

        const position: [
            number,
            number,
            number,
        ] = [
            player.position.x,
            0,
            player.position.z,
        ];


        // ====================================================
        // NEW BOMB ID
        // ====================================================

        bombId.current += 1;

        const id =
            bombId.current;


        // ====================================================
        // CREATE BOMB
        // ====================================================

        setBomb({
            id,

            position,

            remaining:
                FUSE_TIME,

            exploded:
                false,
        });


        // ====================================================
        // COUNTDOWN
        // ====================================================

        let remaining =
            FUSE_TIME;


        timerRef.current =
            window.setInterval(() => {

                remaining -= 1;


                // ============================================
                // EXPLOSION
                // ============================================

                if (
                    remaining <= 0
                ) {

                    if (
                        timerRef.current !==
                        null
                    ) {
                        window.clearInterval(
                            timerRef.current
                        );

                        timerRef.current =
                            null;
                    }


                    setBomb(
                        (current) => {

                            if (
                                !current ||
                                current.id !== id
                            ) {
                                return current;
                            }


                            return {
                                ...current,

                                remaining: 0,

                                exploded: true,
                            };
                        }
                    );


                    // ========================================
                    // REMOVE EXPLOSION
                    // ========================================

                    explosionTimerRef.current =
                        window.setTimeout(() => {

                            setBomb(
                                (current) => {

                                    if (
                                        !current ||
                                        current.id !== id
                                    ) {
                                        return current;
                                    }

                                    return null;
                                }
                            );


                            explosionTimerRef.current =
                                null;

                        }, EXPLOSION_TIME);


                    return;
                }


                // ============================================
                // UPDATE COUNTDOWN
                // ============================================

                setBomb(
                    (current) => {

                        if (
                            !current ||
                            current.id !== id
                        ) {
                            return current;
                        }


                        return {
                            ...current,

                            remaining:
                                remaining,
                        };
                    }
                );

            }, 1000);


    }, [
        bombRequest,
        playerRef,
    ]);


    // ========================================================
    // CLEANUP
    // ========================================================

    useEffect(() => {

        return () => {

            if (
                timerRef.current !==
                null
            ) {
                window.clearInterval(
                    timerRef.current
                );

                timerRef.current =
                    null;
            }


            if (
                explosionTimerRef.current !==
                null
            ) {
                window.clearTimeout(
                    explosionTimerRef.current
                );

                explosionTimerRef.current =
                    null;
            }
        };

    }, []);


    // ========================================================
    // RENDER
    // ========================================================

    if (!bomb) {
        return null;
    }


    return (
        <Bomb
            position={
                bomb.position
            }

            remaining={
                bomb.remaining
            }

            exploded={
                bomb.exploded
            }
        />
    );
}
