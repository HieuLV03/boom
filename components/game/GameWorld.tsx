
"use client";

import {
    useEffect,
    useRef,
    type RefObject,
} from "react";

import {
    useFrame,
    useThree,
} from "@react-three/fiber";

import type { Group } from "three";

import Player from "./Player";
import RemotePlayers from "./RemotePlayers";

import {
    useMovementStore,
} from "@/stores/movement.store";

import {
    useMultiplayerStore,
} from "@/stores/multiplayer.store";

import {
    useCameraStore,
} from "@/stores/camera.store";


// ============================================================
// CAMERA CONTROLLER
// ============================================================

function CameraController({
    target,
}: {
    target: RefObject<Group | null>;
}) {

    const {
        camera,
    } = useThree();


    useFrame((_, delta) => {

        const player =
            target.current;

        if (!player) {
            return;
        }


        const {
            yaw,
            pitch,
        } =
            useCameraStore.getState();


        // ====================================================
        // CAMERA DISTANCE
        // ====================================================

        const distance = 7;


        // ====================================================
        // CAMERA HEIGHT
        // ====================================================

        const height = 3;


        // ====================================================
        // CAMERA OFFSET
        // ====================================================

        const horizontalDistance =
            distance *
            Math.cos(pitch);


        const targetX =
            player.position.x -
            Math.sin(yaw) *
            horizontalDistance;


        const targetY =
            player.position.y +
            height +
            Math.sin(pitch) *
            distance;


        const targetZ =
            player.position.z -
            Math.cos(yaw) *
            horizontalDistance;


        // ====================================================
        // SMOOTH FOLLOW
        // ====================================================

        const smooth =
            1 -
            Math.pow(
                0.001,
                delta
            );


        camera.position.x +=
            (
                targetX -
                camera.position.x
            ) *
            smooth;


        camera.position.y +=
            (
                targetY -
                camera.position.y
            ) *
            smooth;


        camera.position.z +=
            (
                targetZ -
                camera.position.z
            ) *
            smooth;


        // ====================================================
        // LOOK AT
        // ====================================================

        camera.lookAt(
            player.position.x,
            player.position.y + 1.1,
            player.position.z
        );
    });


    return null;
}


// ============================================================
// LOCAL PLAYER
// ============================================================

function LocalPlayerController({
    playerRef,
}: {
    playerRef: RefObject<Group | null>;
}) {

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


        const serverPlayer =
            room.state?.players?.get(
                room.sessionId
            );


        if (!serverPlayer) {
            return;
        }


        const player =
            playerRef.current;


        if (!player) {
            return;
        }


        player.position.set(
            serverPlayer.x ?? 0,
            serverPlayer.y ?? 0,
            serverPlayer.z ?? 0
        );


        player.rotation.y =
            serverPlayer.rotation ?? 0;

    }, [room, playerRef]);


    // ========================================================
    // MOVEMENT
    // ========================================================

    useFrame((_, delta) => {

        const player =
            playerRef.current;


        if (!player || !room) {
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


        if (
            magnitude < 0.05
        ) {
            return;
        }


        // ====================================================
        // CAMERA ROTATION
        // ====================================================

        const {
            yaw,
        } =
            useCameraStore.getState();


        // ====================================================
        // MOVEMENT SPEED
        // ====================================================

        const speed = 5;


        // ====================================================
        // DIRECTION RELATIVE TO CAMERA
        // ====================================================

        const forwardX =
            -Math.sin(yaw);

        const forwardZ =
            -Math.cos(yaw);


        const rightX =
            Math.cos(yaw);

        const rightZ =
            -Math.sin(yaw);


        // ====================================================
        // FINAL MOVEMENT
        // ====================================================

        const moveX =
            rightX * x +
            forwardX * -y;


        const moveZ =
            rightZ * x +
            forwardZ * -y;


        const moveLength =
            Math.sqrt(
                moveX * moveX +
                moveZ * moveZ
            );


        if (
            moveLength < 0.001
        ) {
            return;
        }


        const normalizedX =
            moveX /
            moveLength;


        const normalizedZ =
            moveZ /
            moveLength;


        player.position.x +=
            normalizedX *
            speed *
            delta;


        player.position.z +=
            normalizedZ *
            speed *
            delta;


        // ====================================================
        // PLAYER ROTATION
        // ====================================================

        player.rotation.y =
            Math.atan2(
                normalizedX,
                normalizedZ
            );


        // ====================================================
        // SEND TO SERVER
        // ====================================================

        room.send(
            "move",
            {
                x:
                    player.position.x,

                y:
                    player.position.y,

                z:
                    player.position.z,

                rotation:
                    player.rotation.y,
            }
        );
    });


    return (
        <group
            ref={playerRef}
        >
            <Player
                position={[
                    0,
                    0,
                    0,
                ]}
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

    const playerRef =
        useRef<Group>(null);


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
                PLAYER
            ================================================== */}

            <LocalPlayerController
                playerRef={playerRef}
            />


            {/* ==================================================
                CAMERA
            ================================================== */}

            <CameraController
                target={playerRef}
            />


            {/* ==================================================
                ONLINE PLAYERS
            ================================================== */}

            <RemotePlayers />

        </group>
    );
}
