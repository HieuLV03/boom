
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
        // CAMERA SETTINGS
        // ====================================================

        const distance = 7;

        const height = 3;


        // ====================================================
        // CAMERA ORBIT
        //
        // yaw = 0
        //
        // Camera ở phía +Z
        // Camera nhìn về -Z
        // ====================================================

        const horizontalDistance =
            distance *
            Math.cos(pitch);


        const cameraX =
            player.position.x -
            Math.sin(yaw) *
            horizontalDistance;


        const cameraY =
            player.position.y +
            height +
            Math.sin(pitch) *
            distance;


        const cameraZ =
            player.position.z +
            Math.cos(yaw) *
            horizontalDistance;


        // ====================================================
        // SMOOTH CAMERA
        // ====================================================

        const smooth =
            1 -
            Math.pow(
                0.001,
                delta
            );


        camera.position.x +=
            (
                cameraX -
                camera.position.x
            ) *
            smooth;


        camera.position.y +=
            (
                cameraY -
                camera.position.y
            ) *
            smooth;


        camera.position.z +=
            (
                cameraZ -
                camera.position.z
            ) *
            smooth;


        // ====================================================
        // LOOK AT PLAYER
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
    // MOVEMENT VELOCITY
    //
    // Dùng ref để không làm React render lại liên tục.
    //
    // velocityX / velocityZ:
    // vận tốc hiện tại của player.
    // ========================================================

    const velocityX =
        useRef(0);

    const velocityZ =
        useRef(0);


    // ========================================================
    // INITIAL SPAWN
    // ========================================================

    useEffect(() => {

        const player =
            playerRef.current;

        if (!player) {
            return;
        }


        // ----------------------------------------------------
        // SERVER SPAWN
        // ----------------------------------------------------

        if (room) {

            const serverPlayer =
                room.state?.players?.get(
                    room.sessionId
                );


            if (serverPlayer) {

                player.position.set(
                    serverPlayer.x ?? 0,
                    serverPlayer.y ?? 0,
                    serverPlayer.z ?? 0
                );


                player.rotation.y =
                    serverPlayer.rotation ?? 0;


                velocityX.current = 0;

                velocityZ.current = 0;

                return;
            }
        }


        // ----------------------------------------------------
        // LOCAL SPAWN
        // ----------------------------------------------------

        player.position.set(
            0,
            0,
            5
        );

        player.rotation.y = 0;


        velocityX.current = 0;

        velocityZ.current = 0;

    }, [room, playerRef]);


    // ========================================================
    // MOVEMENT
    // ========================================================

    useFrame((_, delta) => {

        const player =
            playerRef.current;

        if (!player) {
            return;
        }


        // ====================================================
        // JOYSTICK INPUT
        // ====================================================

        const {
            x,
            y,
        } =
            useMovementStore.getState();


        // ====================================================
        // INPUT MAGNITUDE
        // ====================================================

        const inputMagnitude =
            Math.sqrt(
                x * x +
                y * y
            );


        // ====================================================
        // DEAD ZONE
        //
        // Tránh tay rung nhẹ làm nhân vật di chuyển.
        // ====================================================

        const DEAD_ZONE = 0.08;


        let normalizedMagnitude = 0;


        if (
            inputMagnitude >
            DEAD_ZONE
        ) {

            normalizedMagnitude =
                (
                    inputMagnitude -
                    DEAD_ZONE
                ) /
                (
                    1 -
                    DEAD_ZONE
                );


            normalizedMagnitude =
                Math.min(
                    1,
                    normalizedMagnitude
                );

        }


        // ====================================================
        // CAMERA ROTATION
        // ====================================================

        const {
            yaw,
        } =
            useCameraStore.getState();


        // ====================================================
        // CAMERA FORWARD
        //
        // yaw = 0
        //
        // Camera nhìn:
        //
        //        -Z
        //         ↓
        //        👤
        //
        // Joystick ↑
        // → chạy -Z
        // ====================================================

        const forwardX =
            -Math.sin(yaw);

        const forwardZ =
            -Math.cos(yaw);


        // ====================================================
        // CAMERA RIGHT
        //
        // yaw = 0:
        //
        //             +X
        //              →
        //             👤
        //
        // Joystick →
        // → chạy +X
        // ====================================================

        const rightX =
            Math.cos(yaw);

        const rightZ =
            -Math.sin(yaw);


        // ====================================================
        // JOYSTICK → CAMERA SPACE
        //
        // x:
        // -1 = trái
        // +1 = phải
        //
        // y:
        // -1 = lên
        // +1 = xuống
        //
        // Vì joystick ↑ là y = -1
        // nên phải dùng -y.
        // ====================================================

        let targetX =
            rightX * x +
            forwardX * (-y);


        let targetZ =
            rightZ * x +
            forwardZ * (-y);


        // ====================================================
        // TARGET DIRECTION
        // ====================================================

        const targetLength =
            Math.sqrt(
                targetX * targetX +
                targetZ * targetZ
            );


        if (
            targetLength >
            0.001 &&
            normalizedMagnitude > 0
        ) {

            targetX /=
                targetLength;

            targetZ /=
                targetLength;

        } else {

            targetX = 0;

            targetZ = 0;

        }


        // ====================================================
        // SPEED
        // ====================================================
        //
        // Joystick càng kéo xa
        // → tốc độ càng cao.
        //
        // Đây là điểm khác biệt quan trọng
        // so với code cũ.
        // ====================================================

        const MAX_SPEED = 5.5;


        const targetSpeed =
            MAX_SPEED *
            normalizedMagnitude;


        const targetVelocityX =
            targetX *
            targetSpeed;


        const targetVelocityZ =
            targetZ *
            targetSpeed;


        // ====================================================
        // ACCELERATION / DECELERATION
        // ====================================================
        //
        // Không đổi vận tốc ngay lập tức.
        //
        // Có joystick:
        //     → tăng tốc mượt
        //
        // Thả joystick:
        //     → giảm tốc mượt
        // ====================================================

        const ACCELERATION = 18;

        const DECELERATION = 22;


        const acceleration =
            normalizedMagnitude > 0
                ? ACCELERATION
                : DECELERATION;


        const velocityStep =
            acceleration *
            delta;


        // ====================================================
        // MOVE VELOCITY X
        // ====================================================

        const differenceX =
            targetVelocityX -
            velocityX.current;


        if (
            Math.abs(differenceX) <=
            velocityStep
        ) {

            velocityX.current =
                targetVelocityX;

        } else {

            velocityX.current +=
                Math.sign(differenceX) *
                velocityStep;

        }


        // ====================================================
        // MOVE VELOCITY Z
        // ====================================================

        const differenceZ =
            targetVelocityZ -
            velocityZ.current;


        if (
            Math.abs(differenceZ) <=
            velocityStep
        ) {

            velocityZ.current =
                targetVelocityZ;

        } else {

            velocityZ.current +=
                Math.sign(differenceZ) *
                velocityStep;

        }


        // ====================================================
        // APPLY MOVEMENT
        // ====================================================

        const moving =
            Math.abs(velocityX.current) >
                0.001 ||
            Math.abs(velocityZ.current) >
                0.001;


        if (moving) {

            player.position.x +=
                velocityX.current *
                delta;


            player.position.z +=
                velocityZ.current *
                delta;

        }


        // ====================================================
        // PLAYER ROTATION
        // ====================================================
        //
        // Player model:
        //
        // FRONT = local -Z
        //
        // Vì vậy:
        //
        // direction (0, -1)
        // → rotation = 0
        //
        // direction (+1, 0)
        // → rotation = -PI/2
        //
        // direction (0, +1)
        // → rotation = PI
        // ====================================================

        const currentSpeed =
            Math.sqrt(
                velocityX.current *
                    velocityX.current +
                velocityZ.current *
                    velocityZ.current
            );


        if (
            currentSpeed >
            0.05
        ) {

            const directionX =
                velocityX.current /
                currentSpeed;


            const directionZ =
                velocityZ.current /
                currentSpeed;


            player.rotation.y =
                Math.atan2(
                    -directionX,
                    -directionZ
                );

        }


        // ====================================================
        // MULTIPLAYER SYNC
        // ====================================================

        if (room && moving) {

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

        }

    });


    // ========================================================
    // PLAYER
    // ========================================================

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
                args={[
                    1,
                    0,
                ]}
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
                LOCAL PLAYER
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
                REMOTE PLAYERS
            ================================================== */}

            <RemotePlayers />

        </group>
    );
}
