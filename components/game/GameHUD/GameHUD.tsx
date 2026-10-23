
"use client";

import {
    useEffect,
    useRef,
    useState,
        type PointerEvent,

} from "react";

import { useCrouchStore } from "@/stores/crouch.store";
import { useJumpStore } from "@/stores/jump.store";
import { usePunchStore } from "@/stores/punch.store";
import {
    useCameraStore,
} from "@/stores/camera.store";
import { useRunStore } from "@/stores/run.store";
import "./GameHUD.css";
import { useAimStore } from "@/stores/aim.store";
import { useAimingStore } from "@/stores/aiming.store";
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
type NearbyDoor = {
    id: string;
    open: boolean;
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

const MIN_CAMERA_PITCH = -1.45;
const MAX_CAMERA_PITCH = 1.52;
    const room = useMultiplayerStore(
        (state) => state.room,
    );

    const [weaponType, setWeaponType] = useState("");
const pickedUpIdsRef = useRef<Set<string>>(new Set());
    const [hp, setHp] = useState(100);

    const [nearbyWeapon, setNearbyWeapon] =
        useState<NearbyWeapon | null>(null);
const [nearbyDoor, setNearbyDoor] =
    useState<NearbyDoor | null>(null);

const [isInteractingDoor, setIsInteractingDoor] =
    useState(false);
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

    const isRifle = hasRifle;

    const aim = useAimStore.getState();
// Báo cho LocalPlayerController xoay thân theo tâm ngắm.
window.dispatchEvent(
    new CustomEvent("boom:attack-aim", {
        detail: {
            direction: aim.direction,
        },
    }),
);

if (isRifle) {
    const range = 51;

    // Gửi tia ngắm camera; LocalPlayerController sẽ tìm
    // điểm va chạm thực tế trên đường ngắm.
    window.dispatchEvent(
        new CustomEvent("boom:request-bullet", {
            detail: {
                origin: aim.origin,
                direction: aim.direction,
                range,
                weapon: "rifle",
            },
        }),
    );
} else {
    usePunchStore.getState().triggerPunch();

}


    // Server vẫn quyết định phát bắn hợp lệ và sát thương.
    room.send("attack", {
        action: isRifle ? "shoot" : "punch",
        origin: aim.origin,
        direction: aim.direction,
    });
};



const stopFiring = () => {
    isFiringRef.current = false;

    // Tắt animation ngắm ở máy hiện tại.
    useAimingStore.getState().setAiming(false);

    // Đồng bộ trạng thái hết ngắm lên server.
    if (room) {
        room.send("aiming", { aiming: false });
    }

    if (fireIntervalRef.current !== null) {
        window.clearInterval(fireIntervalRef.current);
        fireIntervalRef.current = null;
    }
};


const running = useRunStore(
    (state) => state.running,
);

const setRunning = useRunStore(
    (state) => state.setRunning,
);

const handleToggleRun = (
    event: PointerEvent<HTMLButtonElement>,
) => {
    event.preventDefault();
    event.stopPropagation();

    setRunning(!useRunStore.getState().running);
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

if (!hasRifle) {
    useAimingStore.getState().setAiming(false);
    handleAttack();
    return;
}


if (hasRifle) {
    // Bật animation ngắm ở máy hiện tại.
    useAimingStore.getState().setAiming(true);

    // Báo cho server để đồng bộ animation tới đối thủ.
    room?.send("aiming", { aiming: true });
}

isFiringRef.current = true;

    // Bắn ngay phát đầu tiên.
    handleAttack();

    // Tiếp tục bắn trong lúc vẫn giữ nút.
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
// JUMP & CROUCH
// ========================================================


const handleJump = () => {
    if (!room) return;

    // Kích hoạt animation nhảy ở máy hiện tại.
    useJumpStore.getState().triggerJump();

    // Đồng bộ sự kiện nhảy đến server và người chơi khác.
    room.send("jump");
};

const handleCrouch = () => {
    if (!room) return;

    // Đổi trạng thái cúi ở máy hiện tại.
    useCrouchStore.getState().toggleCrouch();

    // Gửi đúng trạng thái mới, không gửi trạng thái cũ.
    const nextCrouching =
        useCrouchStore.getState().crouching;

    room.send("crouch", {
        crouching: nextCrouching,
    });
};


const isCrouching = useCrouchStore(
    (state) => state.crouching,
);

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
    const slot = Number(player.equippedSlot ?? 0);

    const weapon1 = String(player.weapon1 ?? "")
        .trim()
        .toLowerCase();

    const weapon2 = String(player.weapon2 ?? "")
        .trim()
        .toLowerCase();

    const nextWeapon =
        slot === 1 ? weapon1 :
        slot === 2 ? weapon2 :
        "";

    console.log("[HUD WEAPON DEBUG]", {
        roomId: room.roomId,
        sessionId: room.sessionId,
        playerId: player.id,
        slot,
        weapon1,
        weapon2,
        nextWeapon,
    });

    setWeaponType(nextWeapon);
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

// ============================================================
// DETECT NEARBY DOOR
// ============================================================

useEffect(() => {
    if (!room) {
        setNearbyDoor(null);
        setIsInteractingDoor(false);
        return;
    }

    let active = true;

    const updateNearbyDoor = () => {
        if (!active) return;

        const state = room.state as any;
        const players = state?.players;
        const doors = state?.doors;

        if (!players || !doors) {
            setNearbyDoor(null);
            return;
        }

        // Chỉ hiển thị cửa trên map zombie-house.
        if (state.mapId !== "zombie-house") {
            setNearbyDoor(null);
            return;
        }

        const player = players.get(room.sessionId);

        if (!player || player.alive === false) {
            setNearbyDoor(null);
            return;
        }

        const playerX = Number(player.x ?? 0);
        const playerZ = Number(player.z ?? 0);

        const cellSize = 2;
        const mapWidth = 31;
        const mapHeight = 31;

        let nearest: NearbyDoor | null = null;

        doors.forEach((door: any, key: string) => {
            if (!door) return;

            const doorX =
                (Number(door.cellX) - Math.floor(mapWidth / 2)) *
                cellSize;

            const doorZ =
                (Number(door.cellZ) - Math.floor(mapHeight / 2)) *
                cellSize;

            const distance = Math.hypot(
                playerX - doorX,
                playerZ - doorZ,
            );

            if (
                distance <= 2.3 &&
                (!nearest || distance < nearest.distance)
            ) {
                nearest = {
                    id: String(door.id || key),
                    open: Boolean(door.open),
                    distance,
                };
            }
        });

        setNearbyDoor(nearest);
    };

    updateNearbyDoor();

    const intervalId = window.setInterval(
        updateNearbyDoor,
        100,
    );

    return () => {
        active = false;
        window.clearInterval(intervalId);
    };
}, [room]);

    // ========================================================
    // INTERACT WITH DOOR
    // ========================================================

    const handleInteractDoor = () => {
        if (!room || !nearbyDoor || isInteractingDoor) {
            return;
        }

        setIsInteractingDoor(true);

        // Server sẽ xác minh khoảng cách và đổi trạng thái cửa.
        room.send("interactDoor", {
            doorId: nearbyDoor.id,
        });

        // Chống bấm liên tục; trạng thái thực tế vẫn do server quản lý.
        window.setTimeout(() => {
            setIsInteractingDoor(false);
        }, 500);
    };

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
pickedUpIdsRef.current.clear();
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

    const pickupId = String(pickup.id || key);

    // Chỉ ẩn pickup đã được chính người chơi này nhặt.
    if (pickedUpIdsRef.current.has(pickupId)) {
        return;
    }
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
            pickupId?: string;

    }) => {
        console.log("[PICKUP] Server phản hồi weaponPickedUp", {
            message,
            mySessionId: room.sessionId,
        });

        if (
            !active ||
            message?.playerId !== room.sessionId
        ) {
            return;
        }
        if (message.pickupId) {
    pickedUpIdsRef.current.add(message.pickupId);
}

        const pickedType = String(
            message.weaponType ?? "",
        ).trim().toLowerCase();

        const weaponName =
            pickedType === "rifle"
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
        console.log("[PICKUP] Không thể nhặt", {
            hasRoom: Boolean(room),
            nearbyWeapon,
            isPicking,
        });
        return;
    }

    console.log("[PICKUP] Gửi yêu cầu nhặt", {
        pickupId: nearbyWeapon.id,
        weaponType: nearbyWeapon.weaponType,
        distance: nearbyWeapon.distance,
    });

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

const normalizedWeaponType = String(weaponType ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

const hasRifle =
    normalizedWeaponType.includes("rifle") ||
    normalizedWeaponType === "ak47" ||
    normalizedWeaponType === "ak_47";

    console.log("[HUD BUTTON DEBUG]", {
    weaponType,
    normalizedWeaponType,
    hasRifle,
});
    return (
        <div className="game-hud">
            {/* HP BAR */}
            <div
                className="game-hud__hp"
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
                className="game-hud__attack-position">
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
    hasRifle
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
{hasRifle ? "BẮN" : "ĐẤM"}
</button>



            </div>

<button
    type="button"
  className={`game-hud__run-button ${
    running ? "game-hud__run-button--active" : ""
}`}
    onPointerDown={handleToggleRun}
    aria-pressed={running}
    style={{
        touchAction: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
    }}
>
    {running ? "DỪNG CHẠY" : "CHẠY"}
</button>

{/* JUMP & CROUCH BUTTONS */}
<div className="game-hud__movement-actions">
    <button
        type="button"
        className="game-hud__action-button game-hud__jump-button"
        onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            handleJump();
        }}
        onContextMenu={(event) => event.preventDefault()}
        aria-label="Nhảy"
        style={{
            touchAction: "none",
            userSelect: "none",
            WebkitUserSelect: "none",
        }}
    >
        <span className="game-hud__action-icon">↑</span>
        <span>NHẢY</span>
    </button>

    <button
        type="button"
        className={`game-hud__action-button game-hud__crouch-button ${
            isCrouching
                ? "game-hud__crouch-button--active"
                : ""
        }`}
        onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            handleCrouch();
        }}
        onContextMenu={(event) => event.preventDefault()}
        aria-pressed={isCrouching}
        aria-label={isCrouching ? "Đứng thẳng" : "Cúi"}
        style={{
            touchAction: "none",
            userSelect: "none",
            WebkitUserSelect: "none",
        }}
    >
        <span className="game-hud__action-icon">
            {isCrouching ? "↑" : "↓"}
        </span>
        <span>{isCrouching ? "ĐỨNG" : "CÚI"}</span>
    </button>
</div>

            {/* DOOR INTERACTION BUTTON */}
            {nearbyDoor && (
            <div className="game-hud__door-position">
                    <div className="game-hud__door-label">
                        {nearbyDoor.open
                            ? "CỬA ĐANG MỞ"
                            : "CÓ CỬA Ở GẦN"}
                    </div>

                    <button
                        type="button"
                        className="game-hud__door-button"
                        onPointerDown={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            handleInteractDoor();
                        }}
                        disabled={isInteractingDoor}
                        aria-label={
                            nearbyDoor.open
                                ? "Đóng cửa"
                                : "Mở cửa"
                        }
                    >
                        <span className="game-hud__door-icon">
                            🚪
                        </span>

                        <span>
                            {isInteractingDoor
                                ? "ĐANG XỬ LÝ..."
                                : nearbyDoor.open
                                    ? "ĐÓNG CỬA"
                                    : "MỞ CỬA"}
                        </span>
                    </button>
                </div>
            )}

            {/* PICKUP WEAPON BUTTON */}
            {nearbyWeapon && (
           <div className="game-hud__pickup-position">
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
