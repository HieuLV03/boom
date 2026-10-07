
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
import VirtualJoystick from "../VirtualJoystick/VirtualJoystick";
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


    // ========================================================
    // ROOM
    // ========================================================

    const room =
        useMultiplayerStore(
            (state) =>
                state.room
        );


    // ========================================================
    // BOMB
    // ========================================================

    const requestBomb =
        useBombStore(
            (state) =>
                state.requestBomb
        );


    // ========================================================
    // LEAVING
    // ========================================================

    const leavingRef =
        useRef(false);


    // ========================================================
    // BROWSER LEAVE
    // ========================================================

    useEffect(() => {

        if (!room) {
            return;
        }


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


        // ====================================================
        // PAGE HIDE
        // ====================================================

        const handlePageHide = () => {

            /*
             * pagehide chỉ xảy ra khi browser/page
             * thực sự bị ẩn hoặc rời đi.
             *
             * Không dùng router ở đây.
             */

            if (
                leavingRef.current
            ) {
                return;
            }


            leavingRef.current =
                true;


            console.log(
                "[ROOM] pagehide → leaving room"
            );


            try {

                currentRoom.leave();

            }
            catch (error) {

                console.warn(
                    "[ROOM] pagehide leave error:",
                    error
                );

            }


            /*
             * Clear Zustand ngay.
             */

            const latestRoom =
                useMultiplayerStore
                    .getState()
                    .room;


            if (
                latestRoom?.roomId ===
                currentRoom.roomId
            ) {

                useMultiplayerStore
                    .getState()
                    .clearRoom();

            }

        };


        window.addEventListener(
            "pagehide",
            handlePageHide
        );


        // ====================================================
        // CLEANUP
        // ====================================================

        return () => {

            window.removeEventListener(
                "pagehide",
                handlePageHide
            );

        };

    }, [room]);


    // ========================================================
    // OUT
    // ========================================================

    async function handleLeaveGame() {

        /*
         * Nếu đang leave rồi thì bỏ qua.
         */

        if (
            leavingRef.current
        ) {
            return;
        }


        leavingRef.current =
            true;


        console.log("");
        console.log(
            "========================================"
        );
        console.log(
            "[ROOM] OUT CLICKED"
        );
        console.log(
            "========================================"
        );


        const currentRoom =
            useMultiplayerStore
                .getState()
                .room;


        // ====================================================
        // LEAVE COLYSEUS
        // ====================================================

        if (currentRoom) {

            console.log(
                "[ROOM] Leaving:",
                {
                    roomId:
                        currentRoom.roomId,

                    sessionId:
                        currentRoom.sessionId,
                }
            );


            try {

                await currentRoom.leave();

                console.log(
                    "[ROOM] ✅ Left successfully"
                );

            }
            catch (error) {

                console.warn(
                    "[ROOM] ⚠️ Leave error:",
                    error
                );

            }

        }
        else {

            console.warn(
                "[ROOM] No active room"
            );

        }


        // ====================================================
        // CLEAR ROOM
        // ====================================================

        const latestRoom =
            useMultiplayerStore
                .getState()
                .room;


        if (
            !currentRoom ||
            latestRoom?.roomId ===
                currentRoom.roomId
        ) {

            useMultiplayerStore
                .getState()
                .clearRoom();


            console.log(
                "[ROOM] Local room cleared"
            );

        }


        // ====================================================
        // GO MULTIPLAYER
        // ====================================================

        console.log(
            "[ROOM] Navigating to /multiplayer"
        );


        router.replace(
            "/multiplayer"
        );

    }


    // ========================================================
    // RENDER
    // ========================================================

    return (

        <div className="boom-game">

            {/* ==================================================
                3D GAME
            ================================================== */}

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


            {/* ==================================================
                OUT
            ================================================== */}

            <button
                type="button"
                className="boom-game__out"
                onClick={handleLeaveGame}
            >
                OUT
            </button>


            {/* ==================================================
                ROOM CODE
            ================================================== */}

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
                className="boom-game__actions"
            >

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


                <button
                    type="button"
                    className="
                        boom-game__action
                        boom-game__jump-button
                    "
                    onPointerDown={(
                        event
                    ) => {

                        event.stopPropagation();

                    }}
                >
                    🦘
                </button>

            </div>

        </div>

    );

}
