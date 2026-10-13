
"use client";

import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    useFrame,
} from "@react-three/fiber";

import {
    getStateCallbacks,
} from "@colyseus/sdk";

import {
    useMultiplayerStore,
} from "@/stores/multiplayer.store";

import type {
    Group,
} from "three";

// ============================================================
// TYPES
// ============================================================

type WeaponPickup = {
    id: string;
    weaponType: string;
    x: number;
    y: number;
    z: number;
};

// ============================================================
// WEAPON PICKUP CONTROLLER
// ============================================================

export default function WeaponPickupController() {
    const room = useMultiplayerStore(
        (state) => state.room,
    );

    const [pickups, setPickups] =
        useState<WeaponPickup[]>([]);

 
useEffect(() => {
    let active = true;

    setPickups([]);

    if (!room) {
        return;
    }

    const state = room.state as any;
    const pickupMap = state?.weaponPickups;

    if (!pickupMap) {
        console.warn(
            "[WEAPON PICKUP] weaponPickups chưa tồn tại trong room.state",
        );
        return;
    }

    const readPickup = (
        pickup: any,
        key: string,
    ): WeaponPickup => ({
        id: String(pickup?.id || key),
        weaponType: String(pickup?.weaponType || "rifle"),
        x: Number(pickup?.x ?? 0),
        y: Number(pickup?.y ?? 0),
        z: Number(pickup?.z ?? 0),
    });

    const syncPickups = () => {
        if (!active) return;

        const result: WeaponPickup[] = [];

        pickupMap.forEach((pickup: any, key: string) => {
            if (!pickup || pickup.available === false) {
                return;
            }

            result.push(readPickup(pickup, String(key)));
        });

        setPickups(result);
    };

    const callbacks = getStateCallbacks(room);
    const pickupCallbacks = callbacks(pickupMap);

    // Đồng bộ dữ liệu hiện có khi vào phòng.
    syncPickups();

    // Súng được thêm vào bản đồ.
    const removeAddListener = pickupCallbacks.onAdd(
        (pickup: any, key: string) => {
            if (!active) return;

            const id = String(pickup?.id || key);

            if (pickup?.available === false) {
                setPickups((previous) =>
                    previous.filter((item) => item.id !== id),
                );
                return;
            }

            const item = readPickup(pickup, String(key));

            setPickups((previous) => {
                const index = previous.findIndex(
                    (current) => current.id === item.id,
                );

                if (index === -1) {
                    return [...previous, item];
                }

                return previous.map((current) =>
                    current.id === item.id ? item : current,
                );
            });

            console.log("[WEAPON PICKUP] Added:", item);
        },
    );

    // Súng bị xóa khỏi bản đồ.
    const removeRemoveListener = pickupCallbacks.onRemove(
        (pickup: any, key: string) => {
            if (!active) return;

            const id = String(pickup?.id || key);

            setPickups((previous) =>
                previous.filter((item) => item.id !== id),
            );

            console.log("[WEAPON PICKUP] Removed:", id);
        },
    );

    // Theo dõi thay đổi vị trí/trạng thái của pickup.
    const removeChangeListener = pickupCallbacks.onChange(
        () => {
            syncPickups();
        },
    );

    return () => {
        active = false;

        removeAddListener();
        removeRemoveListener();
        removeChangeListener();
    };
}, [room]);

    // ========================================================
    // RENDER PICKUPS
    // ========================================================

    return (
        <group>
            {pickups.map((pickup) => (
                <RiflePickup
                    key={pickup.id}
                    pickup={pickup}
                />
            ))}
        </group>
    );
}

// ============================================================
// RIFLE PICKUP MODEL
// ============================================================

function RiflePickup({
    pickup,
}: {
    pickup: WeaponPickup;
}) {
    const groupRef = useRef<Group>(null);

    const baseY = pickup.y + 0.3;

    useFrame((state) => {
        const group = groupRef.current;

        if (!group) return;

        // Hiệu ứng lơ lửng.
        group.position.y =
            baseY +
            Math.sin(
                state.clock.elapsedTime * 2.5,
            ) * 0.07;

        // Xoay súng tại chỗ.
        group.rotation.y =
            state.clock.elapsedTime * 0.5;
    });

    return (
        <group
            ref={groupRef}
            position={[
                pickup.x,
                baseY,
                pickup.z,
            ]}
        >
            {/* Vòng đánh dấu vị trí súng */}
            <mesh
                position={[0, -baseY + 0.04, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
            >
                <ringGeometry
                    args={[0.38, 0.5, 32]}
                />

                <meshBasicMaterial
                    color="#35ff78"
                    transparent
                    opacity={0.85}
                    depthWrite={false}
                />
            </mesh>

            {/* Thân súng */}
            <mesh>
                <boxGeometry
                    args={[0.85, 0.13, 0.16]}
                />

                <meshStandardMaterial
                    color="#303640"
                    metalness={0.7}
                    roughness={0.35}
                />
            </mesh>

            {/* Nòng súng */}
            <mesh
                position={[0.52, 0.015, 0]}
            >
                <boxGeometry
                    args={[0.42, 0.065, 0.065]}
                />

                <meshStandardMaterial
                    color="#171a20"
                    metalness={0.8}
                    roughness={0.3}
                />
            </mesh>

            {/* Báng súng */}
            <mesh
                position={[-0.53, -0.025, 0]}
            >
                <boxGeometry
                    args={[0.25, 0.11, 0.12]}
                />

                <meshStandardMaterial
                    color="#66472e"
                    roughness={0.8}
                />
            </mesh>

            {/* Tay cầm */}
            <mesh
                position={[-0.08, -0.13, 0]}
                rotation={[0, 0, -0.35]}
            >
                <boxGeometry
                    args={[0.12, 0.22, 0.11]}
                />

                <meshStandardMaterial
                    color="#252930"
                    roughness={0.7}
                />
            </mesh>

            {/* Băng đạn */}
            <mesh
                position={[0.12, -0.14, 0]}
            >
                <boxGeometry
                    args={[0.13, 0.23, 0.12]}
                />

                <meshStandardMaterial
                    color="#171a20"
                    metalness={0.4}
                    roughness={0.6}
                />
            </mesh>

            {/* Chi tiết màu cam */}
            <mesh
                position={[0.02, 0.085, 0]}
            >
                <boxGeometry
                    args={[0.2, 0.025, 0.17]}
                />

                <meshStandardMaterial
                    color="#ff9d2e"
                    emissive="#7a3500"
                />
            </mesh>
        </group>
    );
}
