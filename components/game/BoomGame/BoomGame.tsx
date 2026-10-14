
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

type MapId =
    | "tropical-village"
    | "zombie-house";


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
    // MAP STATE
    // ========================================================

    const [mapId, setMapId] = useState<MapId>(
        "tropical-village"
    );


    // ========================================================
    // JUMPSCARE STATE
    // ========================================================

    const [scareTrigger, setScareTrigger] = useState(0);


    // ========================================================
    // ROOM EVENTS: SCARE OBJECT
    // ========================================================

    useEffect(() => {
        if (!room) return;

        console.log("[ROOM] BoomGame connected:", {
            roomId: room.roomId,
            sessionId: room.sessionId,
        });

        const unsubscribeDamaged = room.onMessage(
            "scareObjectDamaged",
            (data: {
                objectId: string;
                attackerId: string;
                damage: number;
                hp: number;
                maxHp: number;
                destroyed: boolean;
            }) => {
                console.log("[SCARE OBJECT] Damaged:", data);

                if (data.objectId !== "scare-object-1") return;

                useScareObjectStore.getState().setHp(data.hp);
            }
        );

        const unsubscribeDestroyed = room.onMessage(
            "scareObjectDestroyed",
            (data: {
                objectId: string;
                attackerId: string;
            }) => {
                console.log("[SCARE OBJECT] Destroyed:", data);

                if (data.objectId !== "scare-object-1") return;

                setScareTrigger((previous) => previous + 1);
            }
        );

        return () => {
            if (typeof unsubscribeDamaged === "function") {
                unsubscribeDamaged();
            }

            if (typeof unsubscribeDestroyed === "function") {
                unsubscribeDestroyed();
            }
        };
    }, [room]);


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
    // ROOM EVENTS: MAP
    // ========================================================

    useEffect(() => {
        if (!room) {
            setMapId("tropical-village");
            return;
        }

        const updateMapId = () => {
            const currentMapId = room.state?.mapId;

            if (
                currentMapId === "tropical-village" ||
                currentMapId === "zombie-house"
            ) {
                setMapId(currentMapId);
            }
        };

        updateMapId();

        room.onStateChange(() => {
            updateMapId();
        });

        // Không gọi unsubscribe nếu API không trả về hàm hủy đăng ký.
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

                <GameWorld mapId={mapId} />

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
