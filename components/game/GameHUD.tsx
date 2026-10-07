
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


        console.log(
            "[HUD] 🔄 Binding HP listeners:",
            {
                roomId:
                    room.roomId,

                sessionId:
                    room.sessionId,
            }
        );


        const playersMap =
            room.state?.players;


        if (!playersMap) {

            console.warn(
                "[HUD] ❌ Players map not ready"
            );

            return;

        }


        const $ =
            getStateCallbacks(
                room
            );


        let hpUnsubscribe:
            (() => void) | undefined;


        // ====================================================
        // SET HP
        // ====================================================

        const updateHp =
            (
                value: unknown
            ) => {

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


                console.log(
                    "[HUD] ❤️ HP:",
                    safeHp
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


                console.log(
                    "[HUD] 🎯 Local player:",
                    {
                        id:
                            serverPlayer.id,

                        hp:
                            serverPlayer.hp,

                        alive:
                            serverPlayer.alive,
                    }
                );


                // --------------------------------------------
                // INITIAL HP
                // --------------------------------------------

                updateFromPlayer(
                    serverPlayer
                );


                // --------------------------------------------
                // REMOVE OLD LISTENER
                // --------------------------------------------

                hpUnsubscribe?.();


                // --------------------------------------------
                // SCHEMA CHANGES
                // --------------------------------------------

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
        // EXISTING LOCAL PLAYER
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
        else {

            console.log(
                "[HUD] ⏳ Waiting for local player..."
            );

        }


        // ====================================================
        // PLAYER ADDED
        // ====================================================

        const removeAddListener =
            $(
                playersMap
            ).onAdd(
                (
                    serverPlayer: any,
                    playerId: string
                ) => {

                    console.log(
                        "[HUD] ➕ Player added:",
                        {
                            playerId,
                            localSession:
                                room.sessionId,
                        }
                    );


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
        // PLAYER DAMAGED
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

                    console.log(
                        "[HUD] 💥 playerDamaged:",
                        message
                    );


                    // ----------------------------------------
                    // ONLY LOCAL PLAYER
                    // ----------------------------------------

                    if (
                        message?.playerId !==
                        room.sessionId
                    ) {

                        return;

                    }


                    // ----------------------------------------
                    // UPDATE HP
                    // ----------------------------------------

                    updateHp(
                        message.hp
                    );

                }
            );


        // ====================================================
        // PLAYER RESPAWNED
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

                    console.log(
                        "[HUD] ❤️ playerRespawned:",
                        message
                    );


                    // ----------------------------------------
                    // ONLY LOCAL PLAYER
                    // ----------------------------------------

                    if (
                        message?.playerId !==
                        room.sessionId
                    ) {

                        return;

                    }


                    // ----------------------------------------
                    // RESET HP
                    // ----------------------------------------

                    updateHp(
                        message.hp ?? 100
                    );

                }
            );


        // ====================================================
        // CLEANUP
        // ====================================================

        return () => {

            console.log(
                "[HUD] 🧹 Cleanup HP listeners:",
                {
                    roomId:
                        room.roomId,

                    sessionId:
                        room.sessionId,
                }
            );


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

                <div
                    style={{
                        fontSize: 13,
                        marginBottom: 5,
                    }}
                >
                    HP {hp}
                </div>


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
