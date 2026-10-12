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

export default function WeaponController({ playerRef }: Props) {
    const room = useMultiplayerStore((state) => state.room);

    const pickupRequest = useWeaponStore((state) => state.pickupRequest);
    const attackRequest = useWeaponStore((state) => state.attackRequest);
    const attackAction = useWeaponStore((state) => state.attackAction);
    const switchRequest = useWeaponStore((state) => state.switchRequest);
    const requestedSlot = useWeaponStore((state) => state.requestedSlot);

    const setNearbyPickupId = useWeaponStore(
        (state) => state.setNearbyPickupId,
    );
    const setWeaponState = useWeaponStore(
        (state) => state.setWeaponState,
    );

    const [pickups, setPickups] = useState<Pickup[]>([]);
    const previousNearestRef = useRef<string | null>(null);

    // Đồng bộ vật phẩm và vũ khí của người chơi từ Colyseus.
    useEffect(() => {
        if (!room) {
            setPickups([]);
            setNearbyPickupId(null);
            setWeaponState("", "", 0);
            return;
        }

        const state = room.state as any;
        const pickupMap = state.weaponPickups;

        if (!pickupMap) {
            console.warn(
                "[WEAPON] weaponPickups chưa có trên server. Hãy cập nhật BattleState và khởi động lại server.",
            );
            return;
        }

        const $ = getStateCallbacks(room);

        const convert = (item: any): Pickup => ({
            id: String(item.id),
            weaponType: String(item.weaponType || "rifle"),
            x: Number(item.x ?? 0),
            y: Number(item.y ?? 0),
            z: Number(item.z ?? 0),
        });

        const syncPickups = () => {
            const next: Pickup[] = [];

            pickupMap.forEach((item: any) => {
                if (item.available !== false) {
                    next.push(convert(item));
                }
            });

            setPickups(next);
        };

        syncPickups();

        const removePickupAdd = $(pickupMap).onAdd(
            (item: any) => {
                const removeItemChange = $(item).onChange(syncPickups);
                syncPickups();

                // Listener của item sẽ được dọn khi room đóng.
                void removeItemChange;
            },
        );

        const removePickupRemove = $(pickupMap).onRemove(syncPickups);

        const playersMap = state.players;
        let removeLocalChange: (() => void) | undefined;

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
            removeLocalChange = $(player).onChange(syncPlayerWeapons);
        };

        const localPlayer = playersMap?.get(room.sessionId);
        if (localPlayer) bindLocalPlayer(localPlayer);

        const removePlayerAdd = playersMap
            ? $(playersMap).onAdd((player: any, sessionId: string) => {
                if (sessionId === room.sessionId) {
                    bindLocalPlayer(player);
                }
            })
            : undefined;

        return () => {
            removePickupAdd?.();
            removePickupRemove?.();
            removePlayerAdd?.();
            removeLocalChange?.();

            setNearbyPickupId(null);
            setWeaponState("", "", 0);
        };
    }, [room, setNearbyPickupId, setWeaponState]);

    // Chỉ tìm khẩu súng gần nhất; server vẫn tự xác nhận khoảng cách khi nhặt.
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

        if (nearestId !== previousNearestRef.current) {
            previousNearestRef.current = nearestId;
            setNearbyPickupId(nearestId);
        }
    });

    // Gửi yêu cầu nhặt.
    const lastPickupRequest = useRef(0);

    useEffect(() => {
        if (!room || pickupRequest === lastPickupRequest.current) return;

        lastPickupRequest.current = pickupRequest;
        room.send("pickupWeapon");
    }, [room, pickupRequest]);

    // Gửi yêu cầu đấm hoặc bắn.
    const lastAttackRequest = useRef(0);

    useEffect(() => {
        if (!room || attackRequest === lastAttackRequest.current) return;

        lastAttackRequest.current = attackRequest;
        room.send("attack", { action: attackAction });
    }, [room, attackRequest, attackAction]);

    // Gửi yêu cầu đổi ô vũ khí.
    const lastSwitchRequest = useRef(0);

    useEffect(() => {
        if (!room || switchRequest === lastSwitchRequest.current) return;

        lastSwitchRequest.current = switchRequest;
        room.send("switchWeapon", { slot: requestedSlot });
    }, [room, switchRequest, requestedSlot]);

    return (
        <>
            {pickups.map((pickup) => (
                <group
                    key={pickup.id}
                    position={[pickup.x, pickup.y + 0.45, pickup.z]}
                    rotation={[0, Math.PI / 4, 0]}
                    scale={0.24}
                >
                    <WeaponModel weaponType={pickup.weaponType} />
                </group>
            ))}
        </>
    );
}