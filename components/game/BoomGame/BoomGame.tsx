"use client";

import {
    useEffect,
    useRef,
} from "react";

import "./BoomGame.css";

import {
    Canvas,
} from "@react-three/fiber";

import {
    PerspectiveCamera,
} from "@react-three/drei";

import {
    useRouter,
} from "next/navigation";

import GameWorld from "../GameWorld";
import GameHUD from "../GameHUD";
import VirtualJoystick from "../VirtualJoystick";
import TouchCamera from "../TouchCamera";

import {
    useBombStore,
} from "../bomb/bomb.store";

import {
    useMultiplayerStore,
} from "@/stores/multiplayer.store";


// ============================================================
// TYPES
// ============================================================

type Props = {
    roomCode?: string;
};


// ============================================================
// BOOM GAME
// ============================================================

export default function BoomGame({
    roomCode = "",
}: Props) {

    const router = useRouter();


    // ============================================================
    // ROOM
    // ============================================================

    const room =
        useMultiplayerStore(
            (state) =>
                state.room
        );


    // ============================================================
    // BOMB
    // ============================================================

    const requestBomb =
        useBombStore(
            (state) =>
                state.requestBomb
        );


    // ============================================================
    // LEAVE LOCK
    // ============================================================

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


    // ============================================================
    // BROWSER / PAGE LEAVE
    // ============================================================

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


        // ========================================================
        // LEAVE ROOM
        // ========================================================

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


        // ========================================================
        // PAGE HIDDEN
        // ========================================================

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


        // ========================================================
        // BEFORE UNLOAD
        // ========================================================

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


        // ========================================================
        // CLEANUP
        // ========================================================

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


    // ============================================================
    // OUT BUTTON
    // ============================================================

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


        // ========================================================
        // LEAVE COLYSEUS
        // ========================================================

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


        // ========================================================
        // CLEAR ROOM
        // ========================================================

        useMultiplayerStore
            .getState()
            .clearRoom();


        console.log(
            "[ROOM] Local room cleared"
        );


        // ========================================================
        // RETURN
        // ========================================================

        router.replace(
            "/multiplayer"
        );

    }


    // ============================================================
    // RENDER
    // ============================================================

    return (

        <div className="boom-game">

            {/* ====================================================
                3D GAME
            ==================================================== */}

            <Canvas
                shadows
                dpr={[
                    1,
                    1.5,
                ]}
                gl={{
                    antialias:
                        false,
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


            {/* ====================================================
                OUT
            ==================================================== */}

            <button
                type="button"
                className="boom-game__out"
                onPointerDown={(
                    event
                ) => {

                    event.stopPropagation();

                    handleLeaveGame();

                }}
            >
                OUT
            </button>


            {/* ====================================================
                ROOM CODE
            ==================================================== */}

            {roomCode && (

                <div
                    className="boom-game__room-code"
                >

                    Mã phòng:

                    <span
                        className="boom-game__room-code-number"
                    >
                        {roomCode}
                    </span>

                </div>

            )}


            {/* ====================================================
                HUD
            ==================================================== */}

            <GameHUD />


            {/* ====================================================
                LEFT JOYSTICK
            ==================================================== */}

            <VirtualJoystick />


            {/* ====================================================
                RIGHT CAMERA
            ==================================================== */}

            <TouchCamera />


            {/* ====================================================
                ACTION BUTTONS
            ==================================================== */}

            <div
                className="boom-game__actions"
            >

                {/* ==================================================
                    BOMB
                ================================================== */}

                <button
                    type="button"
                    className="
                        boom-game__action
                        boom-game__bomb-button
                    "
                    onPointerDown={(
                        event
                    ) => {

                        event.stopPropagation();

                        requestBomb();

                    }}
                >
                    💣
                </button>


                {/* ==================================================
                    JUMP
                ================================================== */}

                <button
                    type="button"
                    className="
                        boom-game__action
                        boom-game__jump-button
                    "
                >
                    🦘
                </button>

            </div>

        </div>

    );

}