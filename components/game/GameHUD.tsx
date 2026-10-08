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
    // ORIENTATION
    // ========================================================

    const [
        isPortrait,
        setIsPortrait,
    ] = useState(false);


    useEffect(() => {

        function checkOrientation() {

            setIsPortrait(
                window.innerHeight >
                window.innerWidth
            );

        }

        checkOrientation();

        window.addEventListener(
            "resize",
            checkOrientation
        );

        window.addEventListener(
            "orientationchange",
            checkOrientation
        );

        return () => {

            window.removeEventListener(
                "resize",
                checkOrientation
            );

            window.removeEventListener(
                "orientationchange",
                checkOrientation
            );

        };

    }, []);


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

            </div>


            {/* =================================================
                HP BAR
            ================================================= */}

            <div
                style={{
                    position: "absolute",

                    /*
                     * NGANG
                     * ----------------
                     * giữa phía dưới
                     */
                    left: isPortrait
                        ? "0px"
                        : "50%",

                    bottom: isPortrait
                        ? "auto"
                        : 30,

                    /*
                     * DỌC
                     * ----------------
                     * giữa bên trái
                     */
                    top: isPortrait
                        ? "50%"
                        : "auto",

              
                    width: 180,

                    transform:
                        isPortrait
                                    ? "translateY(-50%) rotate(90deg)"

                            : "translateX(-50%)",
                }}
            >

                {/* =================================================
                    HP TEXT
                ================================================= */}

                <div
                    style={{
                        fontSize: 13,

                        marginBottom: 1,

                        textAlign: "center",
                    }}
                >
                    HP {hp}
                </div>


                {/* =================================================
                    HP BACKGROUND
                ================================================= */}

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

        </div>

    );

}