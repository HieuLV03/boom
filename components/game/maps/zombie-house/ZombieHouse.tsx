
"use client";

import { Box } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import {
    Suspense,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { getStateCallbacks } from "@colyseus/sdk";
import * as THREE from "three";
import HospitalModel from "./HospitalModel";
import zombieHouseData from "../../../../shared/maps/zombie-house.json";
import { createGridMap } from "../../../../shared/maps/grid-map";
import { ZOMBIE_HOUSE_DOORS } from "../../../../shared/maps/doors";
import { useMultiplayerStore } from "@/stores/multiplayer.store";

import "./ZombieHouse.css";

// ============================================================
// MAP CONFIG
// ============================================================

const mapConfig = createGridMap(zombieHouseData);

const CELL_SIZE = mapConfig.CELL_SIZE;
const MAP_WIDTH = mapConfig.MAP_WIDTH;
const MAP_HEIGHT = mapConfig.MAP_HEIGHT;
const MAZE_MAP = mapConfig.MAZE_MAP;

const WALL_HEIGHT = 6;
const DOOR_HEIGHT = 5.4;
const DOOR_FRAME_THICKNESS = 0.12;
const DOOR_FRAME_DEPTH = 0.2;

const ROOF_THICKNESS = 0.4;
const ROOF_COLOR = "#403b35";

// ============================================================
// TYPES
// ============================================================

type DoorVisual = {
    id: string;
    cellX: number;
    cellZ: number;
    axis: "x" | "z";
    open: boolean;
};

// ============================================================
// HOUSE ROOF
// ============================================================


function HouseRoof() {
    const roofRef = useRef<THREE.Mesh>(null);
    const { camera } = useThree();

    const roofWidth = MAP_WIDTH * CELL_SIZE;
    const roofDepth = MAP_HEIGHT * CELL_SIZE;

    // Nâng mái cao hơn đỉnh tường.
    const roofY = WALL_HEIGHT + 1.5;

    const cameraPosition = useMemo(
        () => new THREE.Vector3(),
        [],
    );

    const cameraDirection = useMemo(
        () => new THREE.Vector3(),
        [],
    );

    useFrame(() => {
        const roof = roofRef.current;
        if (!roof) return;

        camera.getWorldPosition(cameraPosition);
        camera.getWorldDirection(cameraDirection);

        // Camera có nằm trong phạm vi ngôi nhà không?
        const insideHouse =
            Math.abs(cameraPosition.x) < roofWidth / 2 &&
            Math.abs(cameraPosition.z) < roofDepth / 2;

        // Camera đang hướng xuống dưới hay nhìn ngang?
        const lookingDown = cameraDirection.y < -0.15;

        // Ẩn mái khi camera ở trong nhà và nhìn xuống.
        // Khi nhìn lên, mái hiện lại.
        const hideRoof = insideHouse && lookingDown;

        roof.visible = !hideRoof;
    });

    return (
        <mesh
            ref={roofRef}
            position={[0, roofY, 0]}
            castShadow
            receiveShadow
        >
            <boxGeometry
                args={[
                    roofWidth,
                    ROOF_THICKNESS,
                    roofDepth,
                ]}
            />

            <meshStandardMaterial
                color="#403b35"
                roughness={0.95}
                metalness={0}
                side={THREE.DoubleSide}
                transparent={false}
                opacity={1}
                depthWrite
            />
        </mesh>
    );
}



// ============================================================
// ZOMBIE HOUSE
// ============================================================

export default function ZombieHouse() {
    const room = useMultiplayerStore(
        (state) => state.room,
    );

    const [doorStates, setDoorStates] = useState<
        Record<string, boolean>
    >({});

    // ========================================================
    // REALTIME DOOR SYNC — NO POLLING
    // ========================================================

    useEffect(() => {
        if (!room) {
            setDoorStates({});
            return;
        }

        const doors = room.state?.doors;

        if (!doors) {
            setDoorStates({});
            return;
        }

        const $ = getStateCallbacks(room);

        let disposed = false;

        const doorUnsubscribers = new Map<
            string,
            () => void
        >();

        const bindDoor = (
            door: any,
            key: string | number,
        ) => {
            const id = String(door.id ?? key);

            // Tránh đăng ký listener trùng.
            if (doorUnsubscribers.has(id)) {
                return;
            }

            // Đồng bộ trạng thái cửa ban đầu.
            setDoorStates((previous) => {
                const open = Boolean(door.open);

                if (previous[id] === open) {
                    return previous;
                }

                return {
                    ...previous,
                    [id]: open,
                };
            });

            // Theo dõi thay đổi từ Colyseus.
            const unsubscribe = $(door).onChange(() => {
                if (disposed) return;

                const open = Boolean(door.open);

                setDoorStates((previous) => {
                    if (previous[id] === open) {
                        return previous;
                    }

                    return {
                        ...previous,
                        [id]: open,
                    };
                });
            });

            doorUnsubscribers.set(id, unsubscribe);
        };

        // Đăng ký các cửa đã tồn tại.
        doors.forEach((door: any, key: string) => {
            bindDoor(door, key);
        });

        // Theo dõi cửa mới được thêm.
        const unsubscribeAdd = $(doors as any).onAdd(
            (door: any, key: string | number) => {
                bindDoor(door, key);
            },
        );

        // Theo dõi cửa bị xóa.
        const unsubscribeRemove = $(doors as any).onRemove(
            (door: any, key: string | number) => {
                const id = String(door.id ?? key);

                doorUnsubscribers.get(id)?.();
                doorUnsubscribers.delete(id);

                if (disposed) return;

                setDoorStates((previous) => {
                    if (!(id in previous)) {
                        return previous;
                    }

                    const next = { ...previous };
                    delete next[id];

                    return next;
                });
            },
        );

        return () => {
            disposed = true;

            unsubscribeAdd?.();
            unsubscribeRemove?.();

            doorUnsubscribers.forEach((unsubscribe) => {
                unsubscribe();
            });

            doorUnsubscribers.clear();
        };
    }, [room]);

    // ========================================================
    // WALLS — STATIC GEOMETRY
    // ========================================================

    const walls = useMemo(() => {
        const result: {
            x: number;
            z: number;
            key: string;
        }[] = [];

        const offsetX = Math.floor(MAP_WIDTH / 2);
        const offsetZ = Math.floor(MAP_HEIGHT / 2);

        MAZE_MAP.forEach((row, z) => {
            row.split("").forEach((cell, x) => {
                if (cell !== "#") return;

                result.push({
                    x: (x - offsetX) * CELL_SIZE,
                    z: (z - offsetZ) * CELL_SIZE,
                    key: `${x}-${z}`,
                });
            });
        });

        return result;
    }, []);

    // ========================================================
    // DOORS — REALTIME VISUAL STATE
    // ========================================================

    const doors: DoorVisual[] = useMemo(() => {
        return ZOMBIE_HOUSE_DOORS.map((door) => ({
            ...door,
            open: doorStates[door.id] ?? false,
        }));
    }, [doorStates]);

    // ========================================================
    // RENDER
    // ========================================================

return (
    <group>
        {/* MẶT SÀN */}
        <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -0.1, 0]}
            receiveShadow
        >
            <planeGeometry
                args={[
                    MAP_WIDTH * CELL_SIZE,
                    MAP_HEIGHT * CELL_SIZE,
                ]}
            />
            <meshStandardMaterial color="#77716a" />
        </mesh>

        {/* TƯỜNG — KHỚP VỚI COLLISION TRONG JSON */}
        {walls.map((wall) => (
            <Box
                key={wall.key}
                args={[
                    CELL_SIZE,
                    WALL_HEIGHT,
                    CELL_SIZE,
                ]}
                position={[
                    wall.x,
                    WALL_HEIGHT / 2,
                    wall.z,
                ]}
                castShadow
                receiveShadow
            >
                <meshStandardMaterial color="#8a8178" />
            </Box>
        ))}

        {/* MÁI NHÀ */}
        <HouseRoof />

        {/* MODEL BỆNH VIỆN */}
        <Suspense fallback={null}>
            <HospitalModel />
        </Suspense>
    </group>
);
}
