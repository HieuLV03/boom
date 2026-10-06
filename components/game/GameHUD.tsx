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


export default function GameHUD() {

    // ========================================================
    // MULTIPLAYER ROOM
    // ========================================================

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
    // REALTIME HP
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
            (() => void) | undefined;


        // ====================================================
        // UPDATE HP
        // ====================================================

        const updateHp =
            (serverPlayer: any) => {

                if (!serverPlayer) {
                    return;
                }


                const currentHp =
                    Number(
                        serverPlayer.hp ?? 100
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
        // EXISTING LOCAL PLAYER
        // ====================================================

        const localPlayer =
            playersMap.get(
                room.sessionId
            );


        if (localPlayer) {

            updateHp(
                localPlayer
            );


            hpUnsubscribe =
                $(localPlayer).onChange(
                    () => {

                        updateHp(
                            localPlayer
                        );

                    }
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


                    hpUnsubscribe?.();


                    updateHp(
                        serverPlayer
                    );


                    hpUnsubscribe =
                        $(serverPlayer).onChange(
                            () => {

                                updateHp(
                                    serverPlayer
                                );

                            }
                        );

                }
            );


        // ====================================================
        // DIRECT DAMAGE EVENT
        // ====================================================

        const removeDamageListener =
            room.onMessage(
                "playerDamaged",
                (
                    message: {
                        playerId?: string;
                        hp?: number;
                    }
                ) => {

                    if (
                        message?.playerId !==
                        room.sessionId
                    ) {
                        return;
                    }


                    const newHp =
                        Number(
                            message.hp ?? 0
                        );


                    const safeHp =
                        Math.max(
                            0,
                            Math.min(
                                100,
                                newHp
                            )
                        );


                    setHp(
                        safeHp
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

        };

    }, [room]);


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
            }}
        >

            {/* ==================================================
                TOP LEFT
            ================================================== */}

            <div
                style={{
                    position: "absolute",
                    top: 18,
                    left: 18,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                }}
            >

                <div
                    style={{
                        fontSize: 18,
                        fontWeight: 700,
                    }}
                >
                    BOOM
                </div>


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


            {/* ==================================================
                HP
            ================================================== */}

            <div
                style={{
                    position: "absolute",
                    left: 567,
                    bottom: 30,
                    width: 180,
                }}
            >

                {/* HP TEXT */}

                <div
                    style={{
                        fontSize: 13,
                        marginBottom: 5,
                    }}
                >
                    HP {hp}
                </div>


                {/* HP BAR */}

                <div
                    style={{
                        height: 12,
                        background:
                            "rgba(0,0,0,.6)",
                        borderRadius: 8,
                        overflow: "hidden",
                    }}
                >

                    <div
                        style={{
                            width:
                                `${hpPercent * 100}%`,
                            height: "100%",
                            background:
                                "#22c55e",
                            transition:
                                "width 0.15s ease",
                        }}
                    />

                </div>

            </div>


            {/* ==================================================
                CROSSHAIR
            ================================================== */}

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


            {/* ==================================================
                WEAPON
            ================================================== */}

            <div
                style={{
                    position: "absolute",
                    right: 20,
                    bottom: 30,
                    textAlign: "right",
                }}
            >

                <div
                    style={{
                        fontSize: 16,
                        opacity: 0.8,
                    }}
                >
                    ASSAULT RIFLE
                </div>


                <div
                    style={{
                        fontSize: 30,
                        fontWeight: 700,
                    }}
                >
                    30 / 120
                </div>

            </div>


            {/* ==================================================
                SAFE ZONE
            ================================================== */}

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