"use client";

import {
    useEffect,
    useState,
} from "react";

import {
    getStateCallbacks,
} from "@colyseus/sdk";

import {
    useMultiplayerStore,
} from "@/stores/multiplayer.store";


// ============================================================
// GAME HUD
// ============================================================

export default function GameHUD() {

    const room =
        useMultiplayerStore(
            (state) =>
                state.room
        );


    // ========================================================
    // HP
    // ========================================================

    const [
        hp,
        setHp,
    ] = useState(100);


    // ========================================================
    // HP LISTENER
    // ========================================================

    useEffect(() => {

        if (!room) {

            setHp(100);

            return;
        }


        const playersMap =
            room.state?.players;


        if (!playersMap) {
            return;
        }


        const $ =
            getStateCallbacks(room);


        let hpUnsubscribe:
            (() => void) |
            undefined;


        // ====================================================
        // UPDATE HP
        // ====================================================

        const updateHp =
            (value: unknown) => {

                const currentHp =
                    Number(
                        value ?? 100
                    );


                const safeHp =
                    Math.max(
                        0,
                        Math.min(
                            100,
                            currentHp
                        )
                    );


                setHp(
                    safeHp
                );

            };


        // ====================================================
        // UPDATE FROM PLAYER
        // ====================================================

        const updateFromPlayer =
            (
                serverPlayer: any
            ) => {

                if (!serverPlayer) {
                    return;
                }


                updateHp(
                    serverPlayer.hp
                );

            };


        // ====================================================
        // BIND LOCAL PLAYER
        // ====================================================

        const bindLocalPlayer =
            (
                serverPlayer: any
            ) => {

                if (!serverPlayer) {
                    return;
                }


                updateFromPlayer(
                    serverPlayer
                );


                hpUnsubscribe?.();


                hpUnsubscribe =
                    $(
                        serverPlayer
                    ).onChange(
                        () => {

                            updateFromPlayer(
                                serverPlayer
                            );

                        }
                    );

            };


        // ====================================================
        // FIND LOCAL PLAYER
        // ====================================================

        const localPlayer =
            playersMap.get(
                room.sessionId
            );


        if (localPlayer) {

            bindLocalPlayer(
                localPlayer
            );

        }


        // ====================================================
        // PLAYER ADDED
        // ====================================================

        const removeAddListener =
            $(playersMap).onAdd(
                (
                    serverPlayer: any,
                    playerId: string
                ) => {

                    if (
                        playerId !==
                        room.sessionId
                    ) {

                        return;

                    }


                    bindLocalPlayer(
                        serverPlayer
                    );

                }
            );


        // ====================================================
        // DAMAGE
        // ====================================================

        const removeDamageListener =
            room.onMessage(
                "playerDamaged",
                (
                    message: {
                        playerId?: string;
                        damage?: number;
                        hp?: number;
                        alive?: boolean;
                    }
                ) => {

                    if (
                        message?.playerId !==
                        room.sessionId
                    ) {

                        return;

                    }


                    updateHp(
                        message.hp
                    );

                }
            );


        // ====================================================
        // RESPAWN
        // ====================================================

        const removeRespawnListener =
            room.onMessage(
                "playerRespawned",
                (
                    message: {
                        playerId?: string;
                        hp?: number;
                        alive?: boolean;
                    }
                ) => {

                    if (
                        message?.playerId !==
                        room.sessionId
                    ) {

                        return;

                    }


                    updateHp(
                        message.hp ??
                        100
                    );

                }
            );


        // ====================================================
        // CLEANUP
        // ====================================================

        return () => {

            hpUnsubscribe?.();

            removeAddListener?.();

            removeDamageListener?.();

            removeRespawnListener?.();

        };

    }, [
        room,
    ]);


    // ========================================================
    // HP PERCENT
    // ========================================================

    const hpPercent =
        hp / 100;


    // ========================================================
    // RENDER
    // ========================================================

    return (

        <div
            style={{
                position: "absolute",

                inset: 0,

                pointerEvents: "none",

                color: "white",

                fontFamily:
                    "Arial, sans-serif",

                /*
                 * KHÔNG rotate ở đây.
                 *
                 * LandscapeGuard đã rotate toàn bộ
                 * game container khi portrait.
                 */
                transform: "none",

                transformOrigin:
                    "center center",
            }}
        >

            {/* =================================================
                TOP LEFT
            ================================================= */}

            <div
                style={{
                    position: "absolute",

                    top: 18,
                    left: 18,

                    display: "flex",

                    flexDirection:
                        "column",

                    gap: 8,
                }}
            >

                {/* GAME TITLE */}

                <div
                    style={{
                        fontSize: 18,

                        fontWeight: 700,
                    }}
                >
                    BOOM
                </div>


                {/* PLAYER COUNT */}

                <div
                    style={{
                        background:
                            "rgba(0,0,0,.45)",

                        padding:
                            "6px 10px",

                        borderRadius: 8,
                    }}
                >
                    👥 1 / 10
                </div>

            </div>


            {/* =================================================
                HP BAR
            ================================================= */}

            <div
                style={{
                    position: "absolute",

                    left: "50%",

                    bottom: 30,

                    width: 180,

                    transform:
                        "translateX(-50%)",
                }}
            >

                {/* HP TEXT */}

                <div
                    style={{
                        fontSize: 13,

                        marginBottom: 5,

                        textAlign: "center",
                    }}
                >
                    HP {hp}
                </div>


                {/* HP BACKGROUND */}

                <div
                    style={{
                        width: "100%",

                        height: 12,

                        background:
                            "rgba(0,0,0,.6)",

                        borderRadius: 8,

                        overflow: "hidden",
                    }}
                >

                    {/* HP */}

                    <div
                        style={{
                            width:
                                `${hpPercent * 100}%`,

                            height:
                                "100%",

                            background:
                                "#22c55e",

                            transition:
                                "width 0.15s ease",
                        }}
                    />

                </div>

            </div>


            {/* =================================================
                CROSSHAIR
            ================================================= */}

            <div
                style={{
                    position: "absolute",

                    left: "50%",
                    top: "50%",

                    transform:
                        "translate(-50%, -50%)",

                    fontSize: 28,

                    opacity: 0.8,
                }}
            >
                +
            </div>


            {/* =================================================
                SAFE ZONE
            ================================================= */}

            <div
                style={{
                    position: "absolute",

                    top: 18,
                    right: 18,

                    background:
                        "rgba(0,0,0,.45)",

                    padding:
                        "8px 12px",

                    borderRadius: 8,

                    fontSize: 13,
                }}
            >
                SAFE ZONE
                <br />
                02:59
            </div>

        </div>

    );

}