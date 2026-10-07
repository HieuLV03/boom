
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

    const leavingRef =
        useRef(false);


    // ============================================================
    // LEAVE ROOM HELPER
    // ============================================================

    const leaveRoom = async (
        currentRoom: typeof room
    ) => {

        if (!currentRoom) {
            return;
        }


        if (leavingRef.current) {
            return;
        }


        leavingRef.current = true;


        console.log(
            "========================================"
        );

        console.log(
            "[ROOM] Leaving room"
        );

        console.log({
            roomId:
                currentRoom.roomId,

            sessionId:
                currentRoom.sessionId,
        });


        try {

            await currentRoom.leave();

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
        finally {

            /*
             * QUAN TRỌNG:
             *
             * Xóa room ở Zustand.
             *
             * Nếu không clear:
             *
             * Back
             * ↓
             * room cũ vẫn nằm trong store
             * ↓
             * vào game lại
             * ↓
             * client có thể dùng room cũ
             */

            useMultiplayerStore
                .getState()
                .clearRoom();


            console.log(
                "[ROOM] Local room cleared"
            );
        }

    };


    // ============================================================
    // BROWSER PAGE LEAVE
    // ============================================================

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


        // ========================================================
        // PAGE HIDE
        // ========================================================

        const handlePageHide = () => {

            console.log(
                "[ROOM] pagehide"
            );


            /*
             * Không await trong pagehide.
             *
             * Browser có thể đang đóng/ẩn document.
             */

            if (
                !leavingRef.current
            ) {

                leavingRef.current =
                    true;


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
                 * Clear local state ngay.
                 */

                useMultiplayerStore
                    .getState()
                    .clearRoom();


                console.log(
                    "[ROOM] pagehide → room cleared"
                );
            }

        };


        // ========================================================
        // BEFORE UNLOAD
        // ========================================================

        const handleBeforeUnload = () => {

            console.log(
                "[ROOM] beforeunload"
            );


            if (
                leavingRef.current
            ) {
                return;
            }


            leavingRef.current =
                true;


            try {

                currentRoom.leave();

            }
            catch (error) {

                console.warn(
                    "[ROOM] beforeunload leave error:",
                    error
                );

            }


            useMultiplayerStore
                .getState()
                .clearRoom();

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


            /*
             * Component thực sự bị unmount.
             *
             * Nếu room vẫn chính là room hiện tại
             * thì dọn luôn.
             */

            const latestRoom =
                useMultiplayerStore
                    .getState()
                    .room;


            if (
                latestRoom &&
                latestRoom.roomId ===
                    currentRoom.roomId
            ) {

                if (
                    !leavingRef.current
                ) {

                    leavingRef.current =
                        true;


                    try {

                        latestRoom.leave();

                    }
                    catch (error) {

                        console.warn(
                            "[ROOM] Cleanup leave error:",
                            error
                        );

                    }

                }


                useMultiplayerStore
                    .getState()
                    .clearRoom();

            }

        };

    }, [room]);


    // ============================================================
    // OUT BUTTON
    // ============================================================

    async function handleLeaveGame() {

        if (
            leavingRef.current
        ) {
            return;
        }


        console.log(
            "========================================"
        );

        console.log(
            "[ROOM] OUT clicked"
        );


        const currentRoom =
            useMultiplayerStore
                .getState()
                .room;


        // ========================================================
        // LEAVE
        // ========================================================

        if (currentRoom) {

            await leaveRoom(
                currentRoom
            );

        }
        else {

            console.warn(
                "[ROOM] No active room"
            );


            /*
             * Dù không còn room,
             * vẫn clear store.
             */

            useMultiplayerStore
                .getState()
                .clearRoom();

        }


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
                onClick={handleLeaveGame}
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
