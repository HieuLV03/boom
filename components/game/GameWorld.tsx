
"use client";

import {
    useEffect,
    useRef,
} from "react";

import { useFrame } from "@react-three/fiber";

import type { Group } from "three";

import Player from "./Player";
import RemotePlayers from "./RemotePlayers";

import { useMovementStore } from "@/stores/movement.store";
import { useMultiplayerStore } from "@/stores/multiplayer.store";


// ============================================================
// LOCAL PLAYER CONTROLLER
// ============================================================

function LocalPlayerController() {

    const playerRef =
        useRef<Group>(null);


    const room =
        useMultiplayerStore(
            (state) => state.room
        );


    // ========================================================
    // INITIAL SPAWN
    // ========================================================

    useEffect(() => {

        if (!room) {
            return;
        }


        const player =
            room.state?.players?.get(
                room.sessionId
            );


        if (!player) {
            return;
        }


        const group =
            playerRef.current;


        if (!group) {
            return;
        }


        group.position.set(
            player.x ?? 0,
            player.y ?? 0,
            player.z ?? 0
        );


        group.rotation.y =
            player.rotation ?? 0;

    }, [room]);


    // ========================================================
    // MOVEMENT
    // ========================================================

    useFrame((_, delta) => {

        const player =
            playerRef.current;


        if (!player) {
            return;
        }


        if (!room) {
            return;
        }


        const serverPlayer =
            room.state?.players?.get(
                room.sessionId
            );


        if (!serverPlayer) {
            return;
        }


        const {
            x,
            y,
        } =
            useMovementStore.getState();


        const magnitude =
            Math.sqrt(
                x * x +
                y * y
            );


        // ----------------------------------------------------
        // DEAD ZONE
        // ----------------------------------------------------

        if (
            magnitude < 0.05
        ) {
            return;
        }


        // ----------------------------------------------------
        // SPEED
        // ----------------------------------------------------

        const speed = 5;


        // ----------------------------------------------------
        // MOVE
        // ----------------------------------------------------

        player.position.x +=
            x *
            speed *
            delta;


        player.position.z +=
            y *
            speed *
            delta;


        // ----------------------------------------------------
        // ROTATION
        // ----------------------------------------------------

        player.rotation.y =
            Math.atan2(
                x,
                -y
            );


        // ----------------------------------------------------
        // SEND TO SERVER
        // ----------------------------------------------------

        serverPlayer.x =
            player.position.x;

        serverPlayer.y =
            player.position.y;

        serverPlayer.z =
            player.position.z;

        serverPlayer.rotation =
            player.rotation.y;

    });


    return (
        <group
            ref={playerRef}
        >
            <Player
                position={[0, 0, 0]}
            />
        </group>
    );
}


// ============================================================
// TREE
// ============================================================

function Tree({
    position,
}: {
    position: [number, number, number];
}) {

    return (
        <group
            position={position}
        >

            {/* Trunk */}

            <mesh
                position={[
                    0,
                    1.5,
                    0,
                ]}
                castShadow
            >
                <cylinderGeometry
                    args={[
                        0.3,
                        0.4,
                        3,
                        8,
                    ]}
                />

                <meshStandardMaterial
                    color="#78350f"
                />
            </mesh>


            {/* Leaves */}

            <mesh
                position={[
                    0,
                    3.5,
                    0,
                ]}
                castShadow
            >
                <coneGeometry
                    args={[
                        1.5,
                        3,
                        8,
                    ]}
                />

                <meshStandardMaterial
                    color="#166534"
                />
            </mesh>

        </group>
    );
}


// ============================================================
// ROCK
// ============================================================

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
            <dodecahedronGeometry
                args={[1, 0]}
            />

            <meshStandardMaterial
                color="#6b7280"
            />
        </mesh>
    );
}


// ============================================================
// HOUSE
// ============================================================

function House({
    position,
}: {
    position: [number, number, number];
}) {

    return (
        <group
            position={position}
        >

            {/* House body */}

            <mesh
                position={[
                    0,
                    1.5,
                    0,
                ]}
                castShadow
            >
                <boxGeometry
                    args={[
                        5,
                        3,
                        5,
                    ]}
                />

                <meshStandardMaterial
                    color="#d1d5db"
                />
            </mesh>


            {/* Roof */}

            <mesh
                position={[
                    0,
                    3.8,
                    0,
                ]}
                rotation={[
                    0,
                    Math.PI / 4,
                    0,
                ]}
                castShadow
            >
                <coneGeometry
                    args={[
                        4,
                        2,
                        4,
                    ]}
                />

                <meshStandardMaterial
                    color="#991b1b"
                />
            </mesh>

        </group>
    );
}


// ============================================================
// ROAD
// ============================================================

function Road() {

    return (
        <mesh
            rotation={[
                -Math.PI / 2,
                0,
                0,
            ]}
            position={[
                0,
                0.01,
                0,
            ]}
        >
            <planeGeometry
                args={[
                    8,
                    100,
                ]}
            />

            <meshStandardMaterial
                color="#374151"
            />
        </mesh>
    );
}


// ============================================================
// GAME WORLD
// ============================================================

export default function GameWorld() {

    return (
        <group>

            {/* ==================================================
                GROUND
            ================================================== */}

            <mesh
                rotation={[
                    -Math.PI / 2,
                    0,
                    0,
                ]}
                receiveShadow
            >
                <planeGeometry
                    args={[
                        100,
                        100,
                    ]}
                />

                <meshStandardMaterial
                    color="#4d7c0f"
                />
            </mesh>


            {/* ==================================================
                ROAD
            ================================================== */}

            <Road />


            {/* ==================================================
                HOUSES
            ================================================== */}

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


            {/* ==================================================
                TREES
            ================================================== */}

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


            {/* ==================================================
                ROCKS
            ================================================== */}

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


            {/* ==================================================
                LOCAL PLAYER
            ================================================== */}

            <LocalPlayerController />


            {/* ==================================================
                OTHER ONLINE PLAYERS
            ================================================== */}

            <RemotePlayers />

        </group>
    );
}
