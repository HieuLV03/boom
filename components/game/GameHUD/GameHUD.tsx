
"use client";

import {
    useEffect,
    useState,
} from "react";
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
        if (!room) {
            setNearbyWeapon(null);
            setPickupMessage("");
            setIsPicking(false);
            return;
        }

        const playersMap: any =
            (room.state as any)?.players;

        const pickupMap: any =
            (room.state as any)?.weaponPickups;

        if (!playersMap || !pickupMap) {
            setNearbyWeapon(null);
            return;
        }

        const $ = getStateCallbacks(room);

        let localPlayer: any = null;

        const updateNearbyWeapon = () => {
            if (
                !localPlayer ||
                localPlayer.alive === false
            ) {
                setNearbyWeapon(null);
                return;
            }

            const playerX = Number(localPlayer.x ?? 0);
            const playerZ = Number(localPlayer.z ?? 0);

            let nearest: NearbyWeapon | null = null;

            pickupMap.forEach(
                (pickup: any, key: string) => {
                    if (
                        !pickup ||
                        pickup.available === false
                    ) {
                        return;
                    }

                    const dx =
                        playerX - Number(pickup.x ?? 0);

                    const dz =
                        playerZ - Number(pickup.z ?? 0);

                    const distance = Math.sqrt(
                        dx * dx + dz * dz,
                    );

                    if (
                        distance <= 2.0 &&
                        (
                            !nearest ||
                            distance < nearest.distance
                        )
                    ) {
                        nearest = {
                            id: String(pickup.id || key),
                            weaponType: String(
                                pickup.weaponType || "rifle",
                            ),
                            distance,
                        };
                    }
                },
            );

            setNearbyWeapon(nearest);
        };

        localPlayer = playersMap.get(room.sessionId);

        let playerUnsubscribe: (() => void) | undefined;

        const bindLocalPlayer = (serverPlayer: any) => {
            playerUnsubscribe?.();

            localPlayer = serverPlayer;

            playerUnsubscribe = $(serverPlayer).onChange(
                () => {
                    updateNearbyWeapon();
                },
            );

            updateNearbyWeapon();
        };

        if (localPlayer) {
            bindLocalPlayer(localPlayer);
        }

        const removePlayerAddListener = $(playersMap).onAdd(
            (serverPlayer: any, playerId: string) => {
                if (playerId === room.sessionId) {
                    bindLocalPlayer(serverPlayer);
                }
            },
        );

        const removePickupAddListener = $(pickupMap).onAdd(
            () => {
                updateNearbyWeapon();
            },
        );

        const removePickupRemoveListener = $(
            pickupMap,
        ).onRemove(() => {
            updateNearbyWeapon();
        });

        const removePickedUpListener = room.onMessage(
            "weaponPickedUp",
            (message: {
                playerId?: string;
                weaponType?: string;
                slot?: number;
            }) => {
                if (message?.playerId !== room.sessionId) {
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

        return () => {
            playerUnsubscribe?.();

            removePlayerAddListener();
            removePickupAddListener();
            removePickupRemoveListener();
            removePickedUpListener();
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
                    onClick={handleAttack}
                    className={`game-hud__attack-button ${
                        weaponType === "rifle"
                            ? "game-hud__attack-button--rifle"
                            : "game-hud__attack-button--punch"
                    }`}
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
