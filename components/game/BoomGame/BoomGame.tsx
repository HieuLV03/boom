
"use client";

import {
    useEffect,
    useRef,
    useState,
} from "react";
import { useScareObjectStore } from "@/stores/scareObject.store";
import "./BoomGame.css";
import JumpScareOverlay from "../JumpScareOverlay/JumpScareOverlay";
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
import GameHUD from "../GameHUD/GameHUD";
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

const [scareTrigger, setScareTrigger] = useState(0);
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
    // CONNECTION LOG ONLY
    // ========================================================
    //
    // IMPORTANT:
    //
    // Không đăng ký room.onLeave() ở đây.
    //
    // GamePage là nơi duy nhất xử lý onLeave.
    //
    // ========================================================


// ========================================================
// ROOM EVENTS: CONNECTION + JUMPSCARE
// ========================================================

useEffect(() => {
    if (!room) {
        return;
    }

    console.log(
        "[ROOM] BoomGame connected:",
        {
            roomId: room.roomId,
            sessionId: room.sessionId,
        }
    );

    // Khi vật thể bị bắn, server thông báo HP mới.
 
const handleScareObjectDamaged = (data: {
    objectId: string;
    attackerId: string;
    damage: number;
    hp: number;
    maxHp: number;
    destroyed: boolean;
}) => {
    console.log("[SCARE OBJECT] Damaged:", data);

    if (data.objectId !== "scare-object-1") return;

    // Đồng bộ HP và kích hoạt hiệu ứng đổi màu.
    useScareObjectStore.getState().setHp(data.hp);
};


    // Khi HP vật thể về 0, kích hoạt jumpscare.
    const handleScareObjectDestroyed = (data: {
        objectId: string;
        attackerId: string;
    }) => {
        console.log("[SCARE OBJECT] Destroyed:", data);

        setScareTrigger((previous) => previous + 1);
    };
const unsubscribeDamaged = room.onMessage(
    "scareObjectDamaged",
    handleScareObjectDamaged
);

const unsubscribeDestroyed = room.onMessage(
    "scareObjectDestroyed",
    handleScareObjectDestroyed
);

return () => {
    unsubscribeDamaged?.();
    unsubscribeDestroyed?.();
};
}, [room]);


    // ========================================================
    // OUT
    // ========================================================

    async function handleLeaveGame() {

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


        // ====================================================
        // GET CURRENT ROOM
        // ====================================================

        const currentRoom =
            roomRef.current;


        if (!currentRoom) {

            console.warn(
                "[ROOM] No active room"
            );


            useMultiplayerStore
                .getState()
                .clearRoom();


            router.replace(
                "/multiplayer"
            );


            return;

        }


        console.log(
            "[ROOM] Leaving:",
            {
                roomId:
                    currentRoom.roomId,

                sessionId:
                    currentRoom.sessionId,
            }
        );


        // ====================================================
        // LEAVE COLYSEUS
        // ====================================================
        //
        // QUAN TRỌNG:
        //
        // Chờ leave() hoàn thành trước khi clear store.
        //
        // ====================================================

        try {

            await currentRoom.leave();


            console.log(
                "[ROOM] ✅ Colyseus leave success"
            );

        } catch (error) {

            console.warn(
                "[ROOM] ⚠️ Colyseus leave error:",
                error
            );

        }


        // ====================================================
        // CLEAR ONLY OLD ROOM
        // ====================================================

        const activeRoom =
            useMultiplayerStore
                .getState()
                .room;


        if (
            activeRoom ===
            currentRoom
        ) {

            useMultiplayerStore
                .getState()
                .clearRoom();


            console.log(
                "[ROOM] ✅ Old room cleared"
            );

        }
        else {

            console.log(
                "[ROOM] Store already contains another room"
            );

        }


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
    JUMPSCARE - MA NHÀO LÊN MÀN HÌNH
================================================== */}

<JumpScareOverlay
    trigger={scareTrigger}
    imageSrc="/assets/horror/ghost.jpg"
    audioSrc="/assets/horror/sound-jumpscale.mp3"
/>
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
    BOMB BUTTON - ĐỘC LẬP
================================================== */}

<button
    type="button"
    className="boom-game__bomb-button"
    aria-label="Đặt bom"
    onPointerDown={(event) => {
        event.preventDefault();
        event.stopPropagation();

        if (event.button !== 0) return;

        requestBomb();
    }}
>
    💣
</button>

{/* ==================================================
    JUMP BUTTON - ĐỘC LẬP
================================================== */}


        </div>

    );

}
