
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
    shotgun: "/models/weapons/shotgun.glb",
    pistol: "/models/weapons/pistol.glb",
    smg: "/models/weapons/smg.glb",
    sniper: "/models/weapons/sniper.glb",
};

function getWeaponModelPath(weaponType: string) {
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
        const pickupMap = state.weaponPickups;
        const playersMap = state.players;

        if (!pickupMap) {
            console.warn(
                "[WEAPON] weaponPickups chưa có trên server.",
            );
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
                    if (
                        item &&
                        item.available !== false
                    ) {
                        next.push(
                            convert(item, String(key)),
                        );
                    }
                },
            );

            setPickups(next);
        };

        syncPickups();

        // Theo dõi thêm/xóa/cập nhật pickup.
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

        // Đọc vũ khí của người chơi hiện tại.
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
    // TÌM SÚNG GẦN NHẤT
    // ========================================================

    useFrame(() => {
        const player = playerRef.current;

        let nearestId: string | null = null;
        let nearestDistance = 2.0;

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

        if (
            nearestId !== previousNearestRef.current
        ) {
            previousNearestRef.current = nearestId;
            setNearbyPickupId(nearestId);
        }
    });

    // ========================================================
    // NHẶT SÚNG
    // ========================================================

    const lastPickupRequest = useRef(0);

    useEffect(() => {
        if (
            !room ||
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
        if (
            !room ||
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
        if (
            !room ||
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
    // HIỂN THỊ MODEL SÚNG TRÊN MẶT ĐẤT
    // Chỉ render pickup tại file này.
    // ========================================================

    return (
        <>
            {pickups.map((pickup) => (
                <group
                    key={pickup.id}
                    position={[
                        pickup.x,
                        pickup.y + 0.45,
                        pickup.z,
                    ]}
                    rotation={[0, Math.PI / 4, 0]}
                    scale={0.24}
                >
                    <WeaponModel
                        weaponType={pickup.weaponType}
                        modelPath={getWeaponModelPath(
                            pickup.weaponType,
                        )}
                    />
                </group>
            ))}
        </>
    );
}
