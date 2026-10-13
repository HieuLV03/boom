
"use client";

import {
    useEffect,
    useRef,
    useState,
        type PointerEvent,

} from "react";

import {
    useCameraStore,
} from "@/stores/camera.store";

import "./GameHUD.css";
import { useAimStore } from "@/stores/aim.store";
import { getStateCallbacks } from "@colyseus/sdk";
import { useMultiplayerStore } from "@/stores/multiplayer.store";
import { useCrosshairStore } from "@/stores/crosshair.store";
// ============================================================
// TYPES
// ============================================================

type NearbyWeapon = {
    id: string;
    weaponType: string;
    distance: number;
};

// ============================================================
// CROSSHAIR SETTINGS
// ============================================================

// Phần trăm tính từ cạnh trên màn hình.
// Có thể chỉnh riêng cho chế độ dọc và ngang.
// Tâm ngắm khi màn hình dọc

// ============================================================
// GAME HUD
// ============================================================

export default function GameHUD() {
    const fireIntervalRef = useRef<number | null>(null);
const firePointerRef = useRef<number | null>(null);

const lastPointerRef = useRef({
    x: 0,
    y: 0,
});

const isFiringRef = useRef(false);

const FIRE_INTERVAL = 240;
const CAMERA_SENSITIVITY = 0.003;

const MIN_CAMERA_PITCH = -0.75;
const MAX_CAMERA_PITCH = 0.35;
    const room = useMultiplayerStore(
        (state) => state.room,
    );

    const [weaponType, setWeaponType] = useState("");

    const [isPortrait, setIsPortrait] = useState(false);

    const [hp, setHp] = useState(100);

    const [nearbyWeapon, setNearbyWeapon] =
        useState<NearbyWeapon | null>(null);

    const [isPicking, setIsPicking] = useState(false);

    const [pickupMessage, setPickupMessage] = useState("");
const crosshairX = useCrosshairStore(
    (state) => state.x,
);

const crosshairY = useCrosshairStore(
    (state) => state.y,
);

const crosshairVisible = useCrosshairStore(
    (state) => state.visible,
);
    // ========================================================
    // ATTACK
    // ========================================================

  const handleAttack = () => {
    if (!room) return;

    const aim = useAimStore.getState();

    room.send("attack", {
        action: weaponType === "rifle" ? "shoot" : "punch",
        origin: aim.origin,
        direction: aim.direction,
    });
};

const stopFiring = () => {
    isFiringRef.current = false;

    if (fireIntervalRef.current !== null) {
        window.clearInterval(fireIntervalRef.current);
        fireIntervalRef.current = null;
    }
};

const handleFirePointerDown = (
    event: PointerEvent<HTMLButtonElement>,
) => {
    event.preventDefault();
    event.stopPropagation();

    if (firePointerRef.current !== null) return;

    firePointerRef.current = event.pointerId;

    lastPointerRef.current = {
        x: event.clientX,
        y: event.clientY,
    };

    event.currentTarget.setPointerCapture(event.pointerId);

    // Đấm chỉ một lần mỗi lần chạm.
    if (weaponType !== "rifle") {
        handleAttack();
        return;
    }

    // Súng: bắn ngay viên đầu tiên.
    isFiringRef.current = true;
    handleAttack();

    // Tiếp tục bắn khi người chơi vẫn giữ nút.
    fireIntervalRef.current = window.setInterval(() => {
        if (isFiringRef.current) {
            handleAttack();
        }
    }, FIRE_INTERVAL);
};

const handleFirePointerMove = (
    event: PointerEvent<HTMLButtonElement>,
) => {
    if (firePointerRef.current !== event.pointerId) return;

    event.preventDefault();
    event.stopPropagation();

    const deltaScreenX =
        event.clientX - lastPointerRef.current.x;

    const deltaScreenY =
        event.clientY - lastPointerRef.current.y;

    lastPointerRef.current = {
        x: event.clientX,
        y: event.clientY,
    };

    let deltaX = deltaScreenX;
    let deltaY = deltaScreenY;

    // Giữ quy ước xoay camera dọc mà TouchCamera đang dùng.
    if (window.innerHeight > window.innerWidth) {
        deltaX = deltaScreenY;
        deltaY = -deltaScreenX;
    }

    const {
        yaw,
        pitch,
        setRotation,
    } = useCameraStore.getState();

    const nextYaw =
        yaw + deltaX * CAMERA_SENSITIVITY;

    const nextPitch = Math.max(
        MIN_CAMERA_PITCH,
        Math.min(
            MAX_CAMERA_PITCH,
            pitch + deltaY * CAMERA_SENSITIVITY,
        ),
    );

    setRotation(nextYaw, nextPitch);
};

const handleFirePointerUp = (
    event: PointerEvent<HTMLButtonElement>,
) => {
    if (
        firePointerRef.current !== null &&
        event.pointerId !== firePointerRef.current
    ) {
        return;
    }

    stopFiring();
    firePointerRef.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
    }
};


    // ========================================================
    // ORIENTATION
    // ========================================================

    useEffect(() => {
        const checkOrientation = () => {
            setIsPortrait(
                window.innerHeight > window.innerWidth,
            );
        };

        checkOrientation();

        window.addEventListener("resize", checkOrientation);
        window.addEventListener(
            "orientationchange",
            checkOrientation,
        );

        return () => {
            window.removeEventListener(
                "resize",
                checkOrientation,
            );

            window.removeEventListener(
                "orientationchange",
                checkOrientation,
            );
        };
    }, []);

    // ========================================================
    // CURRENT PLAYER WEAPON
    // ========================================================

    useEffect(() => {
        if (!room) {
            setWeaponType("");
            return;
        }

        const players: any = room.state?.players;

        if (!players) return;

        const $ = getStateCallbacks(room);

        let unsubscribe: (() => void) | undefined;

        const bindPlayer = (player: any) => {
            unsubscribe?.();

            const updateWeapon = () => {
                const slot = Number(
                    player.equippedSlot || 0,
                );

                setWeaponType(
                    slot === 1
                        ? String(player.weapon1 || "")
                        : slot === 2
                            ? String(player.weapon2 || "")
                            : "",
                );
            };

            updateWeapon();

            unsubscribe = $(player).onChange(updateWeapon);
        };

        const localPlayer = players.get(room.sessionId);

        if (localPlayer) {
            bindPlayer(localPlayer);
        }

        const removeAdd = $(players).onAdd(
            (player: any, sessionId: string) => {
                if (sessionId === room.sessionId) {
                    bindPlayer(player);
                }
            },
        );

        return () => {
            unsubscribe?.();
            removeAdd();
        };
    }, [room]);

    // ========================================================
    // HP
    // ========================================================

    useEffect(() => {
        if (!room) {
            setHp(100);
            return;
        }

        const playersMap = room.state?.players;

        if (!playersMap) return;

        const $ = getStateCallbacks(room);

        let hpUnsubscribe: (() => void) | undefined;

        const updateHp = (value: unknown) => {
            const currentHp = Number(value ?? 100);

            setHp(
                Math.max(0, Math.min(100, currentHp)),
            );
        };

        const bindLocalPlayer = (serverPlayer: any) => {
            if (!serverPlayer) return;

            hpUnsubscribe?.();

            updateHp(serverPlayer.hp);

            hpUnsubscribe = $(serverPlayer).onChange(
                () => {
                    updateHp(serverPlayer.hp);
                },
            );
        };

        const localPlayer = playersMap.get(
            room.sessionId,
        );

        if (localPlayer) {
            bindLocalPlayer(localPlayer);
        }

        const removeAddListener = $(playersMap).onAdd(
            (serverPlayer: any, playerId: string) => {
                if (playerId === room.sessionId) {
                    bindLocalPlayer(serverPlayer);
                }
            },
        );

        const removeDamageListener = room.onMessage(
            "playerDamaged",
            (message: {
                playerId?: string;
                hp?: number;
            }) => {
                if (message?.playerId !== room.sessionId) {
                    return;
                }

                updateHp(message.hp);
            },
        );

        const removeRespawnListener = room.onMessage(
            "playerRespawned",
            (message: {
                playerId?: string;
                hp?: number;
            }) => {
                if (message?.playerId !== room.sessionId) {
                    return;
                }

                updateHp(message.hp ?? 100);
            },
        );

        return () => {
            hpUnsubscribe?.();
            removeAddListener();
            removeDamageListener();
            removeRespawnListener();
        };
    }, [room]);

    // ========================================================
    // DETECT NEARBY WEAPON
    // ========================================================

useEffect(() => {
    let active = true;
    let intervalId: number | undefined;
    let lastDebugTime = 0;

    setNearbyWeapon(null);
    setIsPicking(false);
    setPickupMessage("");

    if (!room) {
        console.log("[PICKUP] Không có room");
        return;
    }

    console.log("[PICKUP] Bắt đầu theo dõi room", {
        roomId: room.roomId,
        sessionId: room.sessionId,
    });

    const updateNearbyWeapon = () => {
        if (!active) return;

        const state = room.state as any;
        const playersMap = state?.players;
        const pickupMap = state?.weaponPickups;

        if (!playersMap || !pickupMap) {
            setNearbyWeapon(null);
            return;
        }

        const player = playersMap.get(room.sessionId);

        if (!player || player.alive === false) {
            setNearbyWeapon(null);
            return;
        }

        const playerX = Number(player.x ?? 0);
        const playerZ = Number(player.z ?? 0);

        let nearest: NearbyWeapon | null = null;

        const pickups: Array<{
            id: string;
            distance: number;
            available: boolean;
        }> = [];

        pickupMap.forEach((pickup: any, key: string) => {
            if (!pickup) return;

            const distance = Math.hypot(
                playerX - Number(pickup.x ?? 0),
                playerZ - Number(pickup.z ?? 0),
            );

            pickups.push({
                id: key,
                distance: Number(distance.toFixed(2)),
                available: pickup.available !== false,
            });

            if (
                pickup.available !== false &&
                distance <= 2.8 &&
                (!nearest || distance < nearest.distance)
            ) {
                nearest = {
                    id: String(pickup.id || key),
                    weaponType: String(
                        pickup.weaponType || "rifle",
                    ),
                    distance,
                };
            }
        });

        const now = Date.now();

        if (now - lastDebugTime >= 1000) {
            lastDebugTime = now;

            console.log("[PICKUP] Kiểm tra", {
                roomId: room.roomId,
                sessionId: room.sessionId,
                player: {
                    x: playerX,
                    z: playerZ,
                    alive: player.alive,
                },
                pickupCount: pickupMap.size,
                pickups,
                nearest,
            });
        }

        setNearbyWeapon(nearest);
    };

    const removePickedUpListener = room.onMessage(
        "weaponPickedUp",
        (message: {
            playerId?: string;
            weaponType?: string;
            slot?: number;
        }) => {
            if (
                !active ||
                message?.playerId !== room.sessionId
            ) {
                return;
            }

            const weaponName =
                message.weaponType === "rifle"
                    ? "Súng trường"
                    : message.weaponType || "Vũ khí";

            setPickupMessage(
                `Đã nhặt ${weaponName} · Slot ${message.slot ?? 1}`,
            );

            setIsPicking(false);
            updateNearbyWeapon();
        },
    );

    updateNearbyWeapon();

    intervalId = window.setInterval(
        updateNearbyWeapon,
        100,
    );

    return () => {
        active = false;

        if (intervalId !== undefined) {
            window.clearInterval(intervalId);
        }

        removePickedUpListener();

        console.log("[PICKUP] Dừng theo dõi room", {
            roomId: room.roomId,
            sessionId: room.sessionId,
        });
    };
}, [room]);

    // ========================================================
    // PICKUP WEAPON
    // ========================================================

    const handlePickupWeapon = () => {
        if (!room || !nearbyWeapon || isPicking) {
            return;
        }

        setIsPicking(true);
        setPickupMessage("");

        room.send("pickupWeapon");

        window.setTimeout(() => {
            setIsPicking(false);
        }, 1000);
    };

 
    // ========================================================
    // RENDER
    // ========================================================

    const hpPercent = hp / 100;

    return (
        <div className="game-hud">
            {/* HP BAR */}
            <div
                className={`game-hud__hp ${
                    isPortrait
                        ? "game-hud__hp--portrait"
                        : "game-hud__hp--landscape"
                }`}
            >
                <div className="game-hud__hp-label">
                    HP {hp}
                </div>

                <div className="game-hud__hp-track">
                    <div
                        className="game-hud__hp-fill"
                        style={{
                            width: `${hpPercent * 100}%`,
                        }}
                    />
                </div>
            </div>

            {/* CROSSHAIR */}
            {crosshairVisible && (
                <div
                    className="game-hud__crosshair"
                    style={{
                        left: `${crosshairX * 100}%`,
                        top: `${crosshairY * 100}%`,
                    }}
                >
                    <div className="game-hud__crosshair-part game-hud__crosshair-part--top" />
                    <div className="game-hud__crosshair-part game-hud__crosshair-part--bottom" />
                    <div className="game-hud__crosshair-part game-hud__crosshair-part--left" />
                    <div className="game-hud__crosshair-part game-hud__crosshair-part--right" />
                </div>
            )}

            {/* PICKUP MESSAGE */}
            {pickupMessage && (
                <div className="game-hud__message">
                    {pickupMessage}
                </div>
            )}

            {/* ATTACK BUTTON */}
            <div
                className={`game-hud__attack-position ${
                    isPortrait
                        ? "game-hud__attack-position--portrait"
                        : ""
                }`}
            >
           <button
    type="button"
    onPointerDown={handleFirePointerDown}
    onPointerMove={handleFirePointerMove}
    onPointerUp={handleFirePointerUp}
    onPointerCancel={handleFirePointerUp}
    onLostPointerCapture={() => {
        stopFiring();
        firePointerRef.current = null;
    }}
    className={`game-hud__attack-button ${
        weaponType === "rifle"
            ? "game-hud__attack-button--rifle"
            : "game-hud__attack-button--punch"
    }`}
    style={{
        position: "relative",
        zIndex: 30,
        touchAction: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
    }}
>
    {weaponType === "rifle" ? "BẮN" : "ĐẤM"}
</button>
            </div>

            {/* PICKUP WEAPON BUTTON */}
            {nearbyWeapon && (
                <div
                    className={`game-hud__pickup-position ${
                        isPortrait
                            ? "game-hud__pickup-position--portrait"
                            : ""
                    }`}
                >
                    <div className="game-hud__weapon-label">
                        {nearbyWeapon.weaponType === "rifle"
                            ? "SÚNG TRƯỜNG"
                            : nearbyWeapon.weaponType.toUpperCase()}
                    </div>

                    <button
                        type="button"
                        onClick={handlePickupWeapon}
                        disabled={isPicking}
                        className="game-hud__pickup-button"
                    >
                        {isPicking
                            ? "ĐANG NHẶT..."
                            : "⬆ NHẶT SÚNG"}
                    </button>
                </div>
            )}
        </div>
    );
}
