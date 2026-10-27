
"use client";

import {
    useEffect,
    useRef,
    useState,
    type RefObject,
} from "react";

import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { getStateCallbacks } from "@colyseus/sdk";

import { useMultiplayerStore } from "@/stores/multiplayer.store";
import { useWeaponStore } from "./weapon.store";
import WeaponModel from "./WeaponModel";

type Pickup = {
    id: string;
    weaponType: string;
    x: number;
    y: number;
    z: number;
};

type Props = {
    playerRef: RefObject<Group | null>;
};

const WEAPON_MODELS: Record<string, string> = {
    rifle: "/models/gun/rifle/ak47.glb",
};

const PICKUP_DISTANCE = 2.0;

// Nâng model lên khỏi tọa độ pickup một chút.
// Có thể đổi thành 0 nếu server đã lưu đúng tọa độ tâm model.

const PICKUP_VISUAL_OFFSET = 0;

// Cấu hình riêng cho súng nằm trên mặt đất.
// Các góc xoay được tính bằng độ để dễ chỉnh.
const PICKUP_WEAPON_CONFIG = {
    scale: 0.24,

    // X: ngửa/cúi đầu súng
    // Y: xoay hướng trái/phải
    // Z: nghiêng thân súng
    rotationX: 0,
    rotationY: 90,
    rotationZ: 0,
};

function getWeaponModelPath(weaponType: string): string {
    return (
        WEAPON_MODELS[weaponType.toLowerCase()] ??
        WEAPON_MODELS.rifle
    );
}

export default function WeaponController({
    playerRef,
}: Props) {
    const room = useMultiplayerStore(
        (state) => state.room,
    );

    const pickupRequest = useWeaponStore(
        (state) => state.pickupRequest,
    );
    const attackRequest = useWeaponStore(
        (state) => state.attackRequest,
    );
    const attackAction = useWeaponStore(
        (state) => state.attackAction,
    );
    const switchRequest = useWeaponStore(
        (state) => state.switchRequest,
    );
    const requestedSlot = useWeaponStore(
        (state) => state.requestedSlot,
    );

    const setNearbyPickupId = useWeaponStore(
        (state) => state.setNearbyPickupId,
    );
    const setWeaponState = useWeaponStore(
        (state) => state.setWeaponState,
    );

    const [pickups, setPickups] = useState<Pickup[]>([]);

    const previousNearestRef = useRef<string | null>(null);

    // ========================================================
    // ĐỒNG BỘ PICKUP VÀ VŨ KHÍ NGƯỜI CHƠI
    // ========================================================

    useEffect(() => {
        if (!room) {
            setPickups([]);
            setNearbyPickupId(null);
            setWeaponState("", "", 0);
            previousNearestRef.current = null;
            return;
        }

     const state = room.state as any;
const pickupMap = state?.weaponPickups;
const playersMap = state?.players;

console.log("[WEAPON] Kiểm tra Colyseus state:", {
    roomId: room.roomId,
    hasState: !!state,
    stateKeys: state ? Object.keys(state) : [],
    hasWeaponPickups: !!pickupMap,
    hasPlayers: !!playersMap,
});
        if (!pickupMap) {
     console.log("[WEAPON] State debug:", {
    roomId: room.roomId,
    sessionId: room.sessionId,
    stateConstructor: room.state?.constructor?.name,
    stateKeys: Object.keys(room.state as any),
    hasWeaponPickups: "weaponPickups" in (room.state as any),
    hasPlayers: "players" in (room.state as any),
    hasZombies: "zombies" in (room.state as any),
});
            setPickups([]);
            return;
        }

        const $ = getStateCallbacks(room);

        const convert = (
            item: any,
            key: string,
        ): Pickup => ({
            id: String(item.id || key),
            weaponType: String(
                item.weaponType || "rifle",
            ).toLowerCase(),
            x: Number(item.x ?? 0),
            y: Number(item.y ?? 0),
            z: Number(item.z ?? 0),
        });

        const syncPickups = () => {
            const next: Pickup[] = [];

            pickupMap.forEach(
                (item: any, key: string) => {
                    if (!item || item.available === false) {
                        return;
                    }

                    const pickup = convert(
                        item,
                        String(key),
                    );

                    if (
                        !Number.isFinite(pickup.x) ||
                        !Number.isFinite(pickup.y) ||
                        !Number.isFinite(pickup.z)
                    ) {
                        console.warn(
                            "[WEAPON] Pickup có tọa độ không hợp lệ:",
                            pickup,
                        );
                        return;
                    }

                    next.push(pickup);
                },
            );

            setPickups(next);

            console.log(
                "[WEAPON] Pickup đã đồng bộ:",
                next,
            );
        };

        const itemCleanup = new Map<
            string,
            () => void
        >();

        const bindPickup = (
            item: any,
            key: string,
        ) => {
            const id = String(item.id || key);

            itemCleanup.get(id)?.();

            const removeChange = $(item).onChange(
                syncPickups,
            );

            itemCleanup.set(id, removeChange);
        };

        // Đăng ký listener trước khi đồng bộ lần đầu.
        const removePickupAdd = $(pickupMap).onAdd(
            (item: any, key: string) => {
                bindPickup(item, String(key));
                syncPickups();
            },
        );

        const removePickupRemove = $(pickupMap).onRemove(
            (item: any, key: string) => {
                const id = String(item?.id || key);

                itemCleanup.get(id)?.();
                itemCleanup.delete(id);

                syncPickups();
            },
        );

        pickupMap.forEach(
            (item: any, key: string) => {
                bindPickup(item, String(key));
            },
        );

        syncPickups();

        // Theo dõi vũ khí của người chơi hiện tại.
        let removeLocalChange:
            | (() => void)
            | undefined;

        const bindLocalPlayer = (player: any) => {
            removeLocalChange?.();

            const syncPlayerWeapons = () => {
                setWeaponState(
                    String(player.weapon1 || ""),
                    String(player.weapon2 || ""),
                    Number(player.equippedSlot || 0),
                );
            };

            syncPlayerWeapons();

            removeLocalChange = $(player).onChange(
                syncPlayerWeapons,
            );
        };

        const localPlayer = playersMap?.get(
            room.sessionId,
        );

        if (localPlayer) {
            bindLocalPlayer(localPlayer);
        }

        const removePlayerAdd = playersMap
            ? $(playersMap).onAdd(
                (player: any, sessionId: string) => {
                    if (sessionId === room.sessionId) {
                        bindLocalPlayer(player);
                    }
                },
            )
            : undefined;

        return () => {
            removePickupAdd?.();
            removePickupRemove?.();
            removePlayerAdd?.();
            removeLocalChange?.();

            itemCleanup.forEach((cleanup) => cleanup());
            itemCleanup.clear();

            setNearbyPickupId(null);
            setWeaponState("", "", 0);
            previousNearestRef.current = null;
        };
    }, [room, setNearbyPickupId, setWeaponState]);

    // ========================================================
    // TÌM PICKUP GẦN NHẤT
    // ========================================================

    useFrame(() => {
        const player = playerRef.current;

        let nearestId: string | null = null;
        let nearestDistance = PICKUP_DISTANCE;

        if (player) {
            for (const pickup of pickups) {
                const distance = Math.hypot(
                    player.position.x - pickup.x,
                    player.position.z - pickup.z,
                );

                if (distance <= nearestDistance) {
                    nearestDistance = distance;
                    nearestId = pickup.id;
                }
            }
        }

        if (nearestId !== previousNearestRef.current) {
            previousNearestRef.current = nearestId;
            setNearbyPickupId(nearestId);
        }
    });

    // ========================================================
    // NHẶT SÚNG
    // ========================================================

    const lastPickupRequest = useRef(0);

    useEffect(() => {
        if (!room) {
            lastPickupRequest.current = pickupRequest;
            return;
        }

        if (
            pickupRequest === lastPickupRequest.current
        ) {
            return;
        }

        lastPickupRequest.current = pickupRequest;
        room.send("pickupWeapon");
    }, [room, pickupRequest]);

    // ========================================================
    // TẤN CÔNG
    // ========================================================

    const lastAttackRequest = useRef(0);

    useEffect(() => {
        if (!room) {
            lastAttackRequest.current = attackRequest;
            return;
        }

        if (
            attackRequest === lastAttackRequest.current
        ) {
            return;
        }

        lastAttackRequest.current = attackRequest;

        room.send("attack", {
            action: attackAction,
        });
    }, [room, attackRequest, attackAction]);

    // ========================================================
    // ĐỔI VŨ KHÍ
    // ========================================================

    const lastSwitchRequest = useRef(0);

    useEffect(() => {
        if (!room) {
            lastSwitchRequest.current = switchRequest;
            return;
        }

        if (
            switchRequest === lastSwitchRequest.current
        ) {
            return;
        }

        lastSwitchRequest.current = switchRequest;

        room.send("switchWeapon", {
            slot: requestedSlot,
        });
    }, [room, switchRequest, requestedSlot]);

    // ========================================================
    // RENDER PICKUP TRÊN MAP
    // ========================================================

    return (
        <>
           
{pickups.map((pickup) => (
    <group
        key={pickup.id}
        name={`Pickup_${pickup.id}`}
        position={[
            pickup.x,
            pickup.y + PICKUP_VISUAL_OFFSET,
            pickup.z,
        ]}
    >
        <WeaponModel
            weaponType={pickup.weaponType}
            modelPath={getWeaponModelPath(
                pickup.weaponType,
            )}
            scale={PICKUP_WEAPON_CONFIG.scale}
            rotation={[
                PICKUP_WEAPON_CONFIG.rotationX * Math.PI / 180,
                PICKUP_WEAPON_CONFIG.rotationY * Math.PI / 180,
                PICKUP_WEAPON_CONFIG.rotationZ * Math.PI / 180,
            ]}
                enableFireEffects={false}

        />
    </group>
))}

        </>
    );
}
