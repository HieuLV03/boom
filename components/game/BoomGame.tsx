"use client";

import {
    useEffect,
    useRef,
} from "react";

import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { useRouter } from "next/navigation";

import GameWorld from "./GameWorld";
import GameHUD from "./GameHUD";
import VirtualJoystick from "./VirtualJoystick";
import TouchCamera from "./TouchCamera";

import {
    useBombStore,
} from "./bomb/bomb.store";

import {
    useMultiplayerStore,
} from "@/stores/multiplayer.store";


type Props = {
    roomCode?: string;
};


export default function BoomGame({
    roomCode = "",
}: Props) {

    const router = useRouter();


    // ==================================================
    // ROOM
    // ==================================================

    const room =
        useMultiplayerStore(
            (state) =>
                state.room
        );


    // ==================================================
    // BOMB
    // ==================================================

    const requestBomb =
        useBombStore(
            (state) =>
                state.requestBomb
        );


    // ==================================================
    // LEAVE LOCK
    // ==================================================

    /*
     * Tránh gọi room.leave() nhiều lần.
     *
     * Ví dụ:
     *
     * OUT
     * ↓
     * room.leave()
     * ↓
     * component unmount
     * ↓
     * cleanup cũng chạy
     *
     * Không được leave lần 2.
     */

    const leavingRef =
        useRef(false);


    // ==================================================
    // BROWSER / PAGE LEAVE
    // ==================================================

    useEffect(() => {

        if (!room) {
            return;
        }


        /*
         * Room hiện tại được capture vào effect.
         */
        const currentRoom =
            room;


        console.log(
            "[ROOM] Lifecycle listener attached:",
            {
                roomId:
                    currentRoom.roomId,

                sessionId:
                    currentRoom.sessionId,
            }
        );


        // ==================================================
        // LEAVE ROOM
        // ==================================================

        const leaveRoom =
            () => {

                if (
                    leavingRef.current
                ) {
                    return;
                }


                leavingRef.current =
                    true;


                console.log(
                    "[ROOM] Leaving browser page:",
                    {
                        roomId:
                            currentRoom.roomId,

                        sessionId:
                            currentRoom.sessionId,
                    }
                );


                try {

                    /*
                     * Không await.
                     *
                     * Browser đang rời page.
                     */
                    currentRoom.leave();

                }
                catch (error) {

                    console.warn(
                        "[ROOM] Browser leave error:",
                        error
                    );

                }

            };


        // ==================================================
        // PAGE HIDDEN
        // ==================================================

        /*
         * pagehide đáng tin cậy hơn beforeunload
         * cho mobile/browser lifecycle.
         */
        const handlePageHide =
            () => {

                console.log(
                    "[ROOM] pagehide"
                );

                leaveRoom();

            };


        // ==================================================
        // BEFORE UNLOAD
        // ==================================================

        const handleBeforeUnload =
            () => {

                console.log(
                    "[ROOM] beforeunload"
                );

                leaveRoom();

            };


        window.addEventListener(
            "pagehide",
            handlePageHide
        );


        window.addEventListener(
            "beforeunload",
            handleBeforeUnload
        );


        // ==================================================
        // CLEANUP
        // ==================================================

        return () => {

            window.removeEventListener(
                "pagehide",
                handlePageHide
            );


            window.removeEventListener(
                "beforeunload",
                handleBeforeUnload
            );

        };

    }, [room]);


    // ==================================================
    // OUT BUTTON
    // ==================================================

    async function handleLeaveGame() {

        /*
         * Chặn click nhiều lần.
         */
        if (
            leavingRef.current
        ) {
            return;
        }


        leavingRef.current =
            true;


        console.log(
            "========================================"
        );

        console.log(
            "[ROOM] OUT clicked"
        );


        // ==================================================
        // LEAVE COLYSEUS
        // ==================================================

        if (room) {

            console.log(
                "[ROOM] Leaving room:",
                {
                    roomId:
                        room.roomId,

                    sessionId:
                        room.sessionId,
                }
            );


            try {

                await room.leave();


                console.log(
                    "[ROOM] Left successfully"
                );

            }
            catch (error) {

                console.warn(
                    "[ROOM] Leave error:",
                    error
                );

            }

        }
        else {

            console.warn(
                "[ROOM] No active room"
            );

        }


        // ==================================================
        // CLEAR ROOM
        // ==================================================

        useMultiplayerStore
            .getState()
            .clearRoom();


        console.log(
            "[ROOM] Local room cleared"
        );


        // ==================================================
        // RETURN
        // ==================================================

        router.replace(
            "/multiplayer"
        );

    }


    // ==================================================
    // RENDER
    // ==================================================

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                overflow: "hidden",
                background: "#87ceeb",
            }}
        >

            {/* ==================================================
                3D GAME
            ================================================== */}

            <Canvas
                shadows
                dpr={[1, 1.5]}
                gl={{
                    antialias: false,
                }}
            >

                <PerspectiveCamera
                    makeDefault
                    position={[
                        0,
                        4,
                        7,
                    ]}
                    fov={60}
                />


                <ambientLight
                    intensity={1.5}
                />


                <directionalLight
                    position={[
                        10,
                        20,
                        10,
                    ]}
                    intensity={2}
                    castShadow
                />


                <hemisphereLight
                    intensity={1}
                    color="#87ceeb"
                    groundColor="#4d7c0f"
                />


                <GameWorld />

            </Canvas>


            {/* ==================================================
                OUT
            ================================================== */}

            <button
                type="button"
                onPointerDown={(
                    event
                ) => {

                    event.stopPropagation();

                    handleLeaveGame();

                }}
                style={{
                    position: "absolute",

                    top: 16,
                    left: 16,

                    zIndex: 100,

                    padding:
                        "9px 16px",

                    border:
                        "1px solid rgba(255,255,255,.25)",

                    borderRadius: 10,

                    background:
                        "rgba(220,38,38,.85)",

                    backdropFilter:
                        "blur(8px)",

                    color: "#fff",

                    fontSize: 14,

                    fontWeight: 800,

                    cursor: "pointer",

                    boxShadow:
                        "0 4px 12px rgba(0,0,0,.3)",

                    touchAction:
                        "manipulation",

                    userSelect:
                        "none",

                    WebkitTapHighlightColor:
                        "transparent",
                }}
            >
                OUT
            </button>


            {/* ==================================================
                ROOM CODE
            ================================================== */}

            {roomCode && (

                <div
                    style={{
                        position: "absolute",

                        top: 16,
                        left: "50%",

                        transform:
                            "translateX(-50%)",

                        padding:
                            "8px 16px",

                        background:
                            "rgba(0, 0, 0, 0.65)",

                        backdropFilter:
                            "blur(8px)",

                        border:
                            "1px solid rgba(255,255,255,.2)",

                        borderRadius: 12,

                        color: "#fff",

                        fontSize: 14,

                        fontWeight: 600,

                        zIndex: 20,

                        pointerEvents:
                            "none",

                        textAlign:
                            "center",
                    }}
                >

                    Mã phòng:{" "}

                    <span
                        style={{
                            marginLeft: 6,

                            fontSize: 18,

                            letterSpacing: 3,

                            fontWeight: 800,
                        }}
                    >
                        {roomCode}
                    </span>

                </div>

            )}


            {/* ==================================================
                HUD
            ================================================== */}

            <GameHUD />


            {/* ==================================================
                LEFT JOYSTICK
            ================================================== */}

            <VirtualJoystick />


            {/* ==================================================
                RIGHT CAMERA
            ================================================== */}

            <TouchCamera />


            {/* ==================================================
                ACTION BUTTONS
            ================================================== */}

            <div
                style={{
                    position: "absolute",

                    right: 24,
                    bottom: 80,

                    display: "flex",

                    flexDirection:
                        "column",

                    gap: 14,

                    pointerEvents:
                        "auto",

                    zIndex: 10,
                }}
            >

                {/* ==================================================
                    BOMB
                ================================================== */}

                <button
                    type="button"
                    onPointerDown={(
                        event
                    ) => {

                        event.stopPropagation();

                        requestBomb();

                    }}
                    style={{
                        width: 64,
                        height: 64,

                        borderRadius:
                            "50%",

                        border:
                            "2px solid rgba(255,255,255,.25)",

                        background:
                            "rgba(0,0,0,.55)",

                        color: "#fff",

                        fontSize: 30,

                        display:
                            "flex",

                        alignItems:
                            "center",

                        justifyContent:
                            "center",

                        touchAction:
                            "manipulation",

                        userSelect:
                            "none",

                        WebkitTapHighlightColor:
                            "transparent",
                    }}
                >
                    💣
                </button>


                {/* ==================================================
                    JUMP
                ================================================== */}

                <button
                    type="button"
                    style={{
                        width: 64,
                        height: 64,

                        borderRadius:
                            "50%",

                        border:
                            "2px solid rgba(255,255,255,.25)",

                        background:
                            "rgba(0,0,0,.55)",

                        color: "#fff",

                        fontSize: 28,

                        display:
                            "flex",

                        alignItems:
                            "center",

                        justifyContent:
                            "center",
                    }}
                >
                    🦘
                </button>

            </div>

        </div>
    );
}