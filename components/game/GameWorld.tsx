
"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";

import Player from "./Player";
import { useMovementStore } from "@/stores/movement.store";
import { useMultiplayerStore } from "@/stores/multiplayer.store";

function LocalPlayerController() {
    const playerRef = useRef<Group>(null);

    useFrame((_, delta) => {
        const player = playerRef.current;

        if (!player) return;

        const { x, y } =
            useMovementStore.getState();

        const deadZone = 0.05;

        if (
            Math.abs(x) < deadZone &&
            Math.abs(y) < deadZone
        ) {
            return;
        }

        const speed = 5;

        player.position.x +=
            x * speed * delta;

        player.position.z +=
            y * speed * delta;

        player.rotation.y =
            Math.atan2(x, -y);

        const room =
            useMultiplayerStore.getState().room;

        if (room) {
            room.send("move", {
                x: player.position.x,
                y: player.position.y,
                z: player.position.z,
                rotation: player.rotation.y,
            });
        }
    });

    return (
        <group
            ref={playerRef}
            position={[0, 0, 5]}
        >
            <Player
                position={[0, 0, 0]}
            />
        </group>
    );
}

function Tree({
    position,
}: {
    position: [number, number, number];
}) {
    return (
        <group position={position}>
            <mesh
                position={[0, 1.5, 0]}
                castShadow
            >
                <cylinderGeometry
                    args={[0.3, 0.4, 3, 8]}
                />
                <meshStandardMaterial
                    color="#78350f"
                />
            </mesh>

            <mesh
                position={[0, 3.5, 0]}
                castShadow
            >
                <coneGeometry
                    args={[1.5, 3, 8]}
                />
                <meshStandardMaterial
                    color="#166534"
                />
            </mesh>
        </group>
    );
}

function Rock({
    position,
    scale = 1,
}: {
    position: [number, number, number];
    scale?: number;
}) {
    return (
        <mesh
            position={position}
            scale={scale}
            castShadow
        >
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#6b7280" />
        </mesh>
    );
}

function House({
    position,
}: {
    position: [number, number, number];
}) {
    return (
        <group position={position}>
            <mesh
                position={[0, 1.5, 0]}
                castShadow
            >
                <boxGeometry
                    args={[5, 3, 5]}
                />
                <meshStandardMaterial
                    color="#d1d5db"
                />
            </mesh>

            <mesh
                position={[0, 3.8, 0]}
                rotation={[0, Math.PI / 4, 0]}
                castShadow
            >
                <coneGeometry
                    args={[4, 2, 4]}
                />
                <meshStandardMaterial
                    color="#991b1b"
                />
            </mesh>
        </group>
    );
}

function Road() {
    return (
        <mesh
            rotation={[
                -Math.PI / 2,
                0,
                0,
            ]}
            position={[0, 0.01, 0]}
        >
            <planeGeometry
                args={[8, 100]}
            />

            <meshStandardMaterial
                color="#374151"
            />
        </mesh>
    );
}

export default function GameWorld() {
    return (
        <group>
            {/* Ground */}
            <mesh
                rotation={[
                    -Math.PI / 2,
                    0,
                    0,
                ]}
                receiveShadow
            >
                <planeGeometry
                    args={[100, 100]}
                />

                <meshStandardMaterial
                    color="#4d7c0f"
                />
            </mesh>

            {/* Road */}
            <Road />

            {/* Houses */}
            <House
                position={[
                    -12,
                    0,
                    -12,
                ]}
            />

            <House
                position={[
                    12,
                    0,
                    -18,
                ]}
            />

            <House
                position={[
                    -15,
                    0,
                    18,
                ]}
            />

            {/* Trees */}
            <Tree
                position={[
                    -8,
                    0,
                    -5,
                ]}
            />

            <Tree
                position={[
                    9,
                    0,
                    -7,
                ]}
            />

            <Tree
                position={[
                    15,
                    0,
                    3,
                ]}
            />

            <Tree
                position={[
                    -12,
                    0,
                    8,
                ]}
            />

            <Tree
                position={[
                    8,
                    0,
                    15,
                ]}
            />

            <Tree
                position={[
                    -20,
                    0,
                    -22,
                ]}
            />

            <Tree
                position={[
                    22,
                    0,
                    -25,
                ]}
            />

            <Tree
                position={[
                    -25,
                    0,
                    25,
                ]}
            />

            {/* Rocks */}
            <Rock
                position={[
                    -5,
                    0.5,
                    -15,
                ]}
            />

            <Rock
                position={[
                    7,
                    0.5,
                    8,
                ]}
                scale={1.4}
            />

            <Rock
                position={[
                    -18,
                    0.5,
                    5,
                ]}
                scale={0.8}
            />

            <Rock
                position={[
                    20,
                    0.5,
                    15,
                ]}
                scale={1.2}
            />

            {/* Player */}
            <LocalPlayerController />
        </group>
    );
}
