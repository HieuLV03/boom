
"use client";

import {
    useEffect,
    useRef,
    useState,
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

    const router =
        useRouter();


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


    const [
        isLeaving,
        setIsLeaving,
    ] = useState(false);


    // ========================================================
    // ROOM REF
    // ========================================================

    const roomRef =
        useRef(room);


    useEffect(() => {

        roomRef.current =
            room;

    }, [room]);


    // ========================================================
    // ROOM ON LEAVE
    // ========================================================

    useEffect(() => {

        if (!room) {

            return;

        }


        const currentRoom =
            room;


        console.log(
            "[ROOM] Connected:",
            {
                roomId:
                    currentRoom.roomId,

                sessionId:
                    currentRoom.sessionId,
            }
        );


        // ----------------------------------------------------
        // COLYSEUS LEAVE
        // ----------------------------------------------------

        currentRoom.onLeave?.(
            (
                code
            ) => {

                console.log(
                    "[ROOM] onLeave:",
                    {
                        roomId:
                            currentRoom.roomId,

                        sessionId:
                            currentRoom.sessionId,

                        code,
                    }
                );


                const latestRoom =
                    useMultiplayerStore
                        .getState()
                        .room;


                // --------------------------------------------
                // Chỉ clear room hiện tại
                // --------------------------------------------

                if (
                    latestRoom ===
                    currentRoom
                ) {

                    useMultiplayerStore
                        .getState()
                        .clearRoom();

                }


                // --------------------------------------------
                // Nếu không phải OUT chủ động
                // --------------------------------------------

                if (
                    !leavingRef.current
                ) {

                    leavingRef.current =
                        true;


                    setIsLeaving(
                        true
                    );


                    router.replace(
                        "/multiplayer"
                    );

                }

            }
        );


        // ====================================================
        // IMPORTANT
        // ====================================================
        //
        // Không gọi unsubscribe ở đây.
        //
        // @colyseus/sdk version hiện tại của bạn
        // không trả về unsubscribe function từ onLeave().
        //
        // ====================================================

    }, [
        room,
        router,
    ]);


    // ========================================================
    // OUT
    // ========================================================

    function handleLeaveGame() {

        // ----------------------------------------------------
        // Chống click nhiều lần
        // ----------------------------------------------------

        if (
            leavingRef.current
        ) {

            return;

        }


        leavingRef.current =
            true;


        setIsLeaving(
            true
        );


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
            roomRef.current;


        // ====================================================
        // LEAVE COLYSEUS
        // ====================================================
        //
        // Gọi leave ngay nhưng KHÔNG await.
        //
        // ====================================================

        if (
            currentRoom
        ) {

            console.log(
                "[ROOM] Leaving:",
                {
                    roomId:
                        currentRoom.roomId,

                    sessionId:
                        currentRoom.sessionId,
                }
            );


            currentRoom
                .leave()
                .then(() => {

                    console.log(
                        "[ROOM] ✅ Colyseus leave success"
                    );

                })
                .catch((error) => {

                    console.warn(
                        "[ROOM] ⚠️ Colyseus leave error:",
                        error
                    );

                });

        }
        else {

            console.warn(
                "[ROOM] No active room"
            );

        }


        // ====================================================
        // CLEAR ZUSTAND
        // ====================================================
        //
        // Không chờ Colyseus.
        //
        // ====================================================

        useMultiplayerStore
            .getState()
            .clearRoom();


        console.log(
            "[ROOM] ✅ Zustand room cleared"
        );


        // ====================================================
        // NAVIGATE
        // ====================================================

        console.log(
            "[ROOM] → /multiplayer"
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
                onClick={
                    handleLeaveGame
                }
                disabled={
                    isLeaving
                }
            >

                {
                    isLeaving
                        ? "..."
                        : "OUT"
                }

            </button>


            {/* ==================================================
                ROOM CODE
            ================================================== */}

            {
                roomCode && (

                    <div
                        className="
                            boom-game__room-code
                        "
                    >

                        Mã phòng:

                        <span
                            className="
                                boom-game__room-code-number
                            "
                        >
                            {
                                roomCode
                            }
                        </span>

                    </div>

                )
            }


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
                className="
                    boom-game__actions
                "
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
