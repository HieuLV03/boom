
"use client";

import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import { useScareObjectStore } from "@/stores/scareObject.store";
import { useMultiplayerStore } from "@/stores/multiplayer.store";
import { useBombStore } from "../bomb/bomb.store";

import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { useRouter } from "next/navigation";

import GameWorld from "../GameWorld";
import GameHUD from "../GameHUD/GameHUD";
import VirtualJoystick from "../VirtualJoystick/VirtualJoystick";
import TouchCamera from "../TouchCamera";
import JumpScareOverlay from "../JumpScareOverlay/JumpScareOverlay";

import "./MainGame.css";

// ============================================================
// TYPES
// ============================================================

type Props = {
    roomCode?: string;
};

type MapId = "hospital";

// ============================================================
// BOOM GAME
// ============================================================

export default function MainGame({
    roomCode = "",
}: Props) {
    const router = useRouter();

    const room = useMultiplayerStore(
        (state) => state.room,
    );

    const requestBomb = useBombStore(
        (state) => state.requestBomb,
    );

    const [mapId, setMapId] = useState<MapId>("hospital");
    const [scareTrigger, setScareTrigger] = useState(0);
    const [isLeaving, setIsLeaving] = useState(false);

    const leavingRef = useRef(false);
    const roomRef = useRef(room);

    // ========================================================
    // KEEP CURRENT ROOM REF
    // ========================================================
useEffect(() => {
    roomRef.current = room;

    console.log("[MAIN GAME] Active room:", {
        roomId: room?.roomId ?? null,
        sessionId: room?.sessionId ?? null,
        roomName: room?.name ?? null,
        roomStatus: room?.state?.roomStatus ?? null,
        mapId: room?.state?.mapId ?? null,
        playerCount: room?.state?.players?.size ?? 0,
    });
}, [room]);
    // ========================================================
    // ROOM EVENTS: SCARE OBJECT
    // ========================================================

    useEffect(() => {
        if (!room) return;

        console.log("[ROOM] MainGame connected:", {
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
            },
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
            },
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
    // ROOM EVENTS: MAP
    // ========================================================

useEffect(() => {
    if (!room) {
        setMapId("hospital");
        return;
    }

    const updateMapId = () => {
        const serverMapId = room.state?.mapId;

        if (serverMapId === "hospital") {
            setMapId("hospital");
        }
    };

    updateMapId();

    room.onStateChange(() => {
        updateMapId();
    });
}, [room]);
    // ========================================================
    // LEAVE GAME
    // ========================================================

    const handleLeaveGame = useCallback(async () => {
        if (leavingRef.current) return;

        leavingRef.current = true;
        setIsLeaving(true);

        console.log("[ROOM] OUT CLICKED");

        const currentRoom = roomRef.current;

        if (!currentRoom) {
            console.warn("[ROOM] No active room");

            const store = useMultiplayerStore.getState();
            store.clearRoom();

            router.replace("/multiplayer");
            return;
        }

        console.log("[ROOM] Leaving:", {
            roomId: currentRoom.roomId,
            sessionId: currentRoom.sessionId,
        });

        try {
            await currentRoom.leave();
            console.log("[ROOM] Colyseus leave completed");
        } catch (error) {
            console.warn("[ROOM] Colyseus leave error:", error);
        }

        // Chỉ xóa room nếu store vẫn giữ đúng room vừa rời.
        const activeRoom = useMultiplayerStore.getState().room;

        if (activeRoom === currentRoom) {
            useMultiplayerStore.getState().clearRoom();
            console.log("[ROOM] Old room cleared");
        }

        router.replace("/multiplayer");
    }, [router]);

    // ========================================================
    // RENDER
    // ========================================================

    return (
        <div className="boom-game">
            {/* 3D GAME */}

            <Canvas
                shadows
                dpr={[1, 1.5]}
                gl={{
                    antialias: false,
                }}
            >
                <PerspectiveCamera
                    makeDefault
                    position={[0, 4, 7]}
                    fov={60}
                />

                <ambientLight intensity={1.5} />

                <directionalLight
                    position={[10, 20, 10]}
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

            {/* JUMPSCARE */}

            <JumpScareOverlay trigger={scareTrigger} />

            {/* LEAVE GAME */}

            <button
                type="button"
                className="boom-game__out"
                onClick={handleLeaveGame}
                disabled={isLeaving}
            >
                {isLeaving ? "..." : "OUT"}
            </button>

            {/* ROOM CODE */}

            {roomCode && (
                <div className="boom-game__room-code">
                    Mã phòng:
                    <span className="boom-game__room-code-number">
                        {roomCode}
                    </span>
                </div>
            )}

            {/* HUD */}

            <GameHUD />

            {/* MOVEMENT */}

            <VirtualJoystick />

            {/* CAMERA */}

            <TouchCamera />

            {/* BOMB */}

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
        </div>
    );
}
