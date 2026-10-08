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

    const room =
        useMultiplayerStore(
            (state) =>
                state.room
        );

    const [
        hp,
        setHp,
    ] = useState(100);

    const [
        isPortrait,
        setIsPortrait,
    ] = useState(false);


    useEffect(() => {

        const checkOrientation =
            () => {

                setIsPortrait(
                    window.innerHeight >
                    window.innerWidth
                );

            };


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


    // ============================================
    // GIỮ NGUYÊN TOÀN BỘ PHẦN HP LISTENER CỦA BẠN
    // ============================================

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


        const updateHp =
            (value: unknown) => {

                const currentHp =
                    Number(value ?? 100);

                const safeHp =
                    Math.max(
                        0,
                        Math.min(
                            100,
                            currentHp
                        )
                    );

                setHp(safeHp);
            };


        const updateFromPlayer =
            (serverPlayer: any) => {

                if (!serverPlayer) {
                    return;
                }

                updateHp(
                    serverPlayer.hp
                );
            };


        const bindLocalPlayer =
            (serverPlayer: any) => {

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
                    ).onChange(() => {

                        updateFromPlayer(
                            serverPlayer
                        );

                    });
            };


        const localPlayer =
            playersMap.get(
                room.sessionId
            );


        if (localPlayer) {

            bindLocalPlayer(
                localPlayer
            );

        }


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
                        message.hp ?? 100
                    );

                }
            );


        return () => {

            hpUnsubscribe?.();

            removeAddListener?.();

            removeDamageListener?.();

            removeRespawnListener?.();

        };

    }, [room]);


    const hpPercent =
        hp / 100;


    return (
        <div
            style={{
                position: "absolute",
                inset: 0,

                pointerEvents: "none",

                color: "white",

                fontFamily:
                    "Arial, sans-serif",

                transform:
                    isPortrait
                        ? "rotate(90deg)"
                        : "none",

                transformOrigin:
                    "center center",
            }}
        >

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