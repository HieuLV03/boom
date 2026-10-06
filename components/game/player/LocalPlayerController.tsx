
"use client";

import {
    useEffect,
    useRef,
    useState,
    type RefObject,
} from "react";

import {
    useFrame,
    useThree,
} from "@react-three/fiber";

import {
    Vector3,
    type Group,
} from "three";

import {
    getStateCallbacks,
} from "@colyseus/sdk";

import Player from "./Player";

import {
    useMovementStore,
} from "@/stores/movement.store";

import {
    useMultiplayerStore,
} from "@/stores/multiplayer.store";

import {
    canMoveTo,
} from "../maps/tropical-village/maze.config";


// ============================================================
// CAMERA DIRECTION CACHE
// ============================================================

const _cameraDirection =
    new Vector3();


// ============================================================
// TYPES
// ============================================================

type Props = {
    playerRef: RefObject<Group | null>;
};


// ============================================================
// LOCAL PLAYER CONTROLLER
// ============================================================

export default function LocalPlayerController({
    playerRef,
}: Props) {

    const {
        camera,
    } = useThree();


    // ========================================================
    // MULTIPLAYER
    // ========================================================

    const room =
        useMultiplayerStore(
            (state) =>
                state.room
        );


    // ========================================================
    // PLAYER NAME
    // ========================================================

    const [
        playerName,
        setPlayerName,
    ] = useState("Player");


    // ========================================================
    // PLAYER ALIVE
    // ========================================================

    const [
        isDead,
        setIsDead,
    ] = useState(false);


    // ========================================================
    // VELOCITY
    // ========================================================

    const velocityX =
        useRef(0);

    const velocityZ =
        useRef(0);


    // ========================================================
    // BOMB COLLISION
    // ========================================================
    //
    // Cho phép player đi ra khỏi quả bom mà mình đang đứng trên.
    //
    // Ví dụ:
    //
    //        💣
    //        👤 →
    //
    // Player vừa đặt bom sẽ không bị khóa cứng.
    //
    // Sau khi player rời khỏi vùng bom:
    //
    //        💣    👤
    //
    // Nếu quay lại:
    //
    //        👤 → 💣
    //
    // sẽ bị chặn.
    //
    // ========================================================

    const bombEscape =
        useRef<
            Set<string>
        >(
            new Set()
        );


    // ========================================================
    // REALTIME PLAYER STATE
    // ========================================================

    useEffect(() => {

        if (!room) {

            console.log(
                "[PLAYER] No Colyseus room"
            );

            setPlayerName("Player");
            setIsDead(false);

            return;
        }


        console.log(
            "[PLAYER] Player state listener connected"
        );

        console.log(
            "[PLAYER] Session ID:",
            room.sessionId
        );


        // ====================================================
        // STATE
        // ====================================================

        const playersMap =
            room.state?.players;


        if (!playersMap) {

            console.warn(
                "[PLAYER] room.state.players not found"
            );

            return;
        }


        const $ =
            getStateCallbacks(room);


        let playerUnsubscribe:
            (() => void) | undefined;


        // ====================================================
        // BIND LOCAL PLAYER
        // ====================================================

        const bindLocalPlayer = (
            serverPlayer: any
        ) => {

            if (!serverPlayer) {
                return;
            }


            console.log(
                "[PLAYER] Local player state found"
            );


            console.log(
                "[PLAYER] Name:",
                serverPlayer.name
            );


            console.log(
                "[PLAYER] HP:",
                serverPlayer.hp
            );


            console.log(
                "[PLAYER] Alive:",
                serverPlayer.alive
            );


            // ================================================
            // NAME
            // ================================================

            setPlayerName(
                serverPlayer.name ||
                "Player"
            );


            // ================================================
            // ALIVE
            // ================================================

            const alive =
                serverPlayer.alive !== false;


            setIsDead(
                !alive
            );


            // ================================================
            // RESET VELOCITY
            // ================================================

            if (!alive) {

                velocityX.current = 0;
                velocityZ.current = 0;

            }


            // ================================================
            // REMOVE OLD LISTENER
            // ================================================

            playerUnsubscribe?.();


            // ================================================
            // STATE CHANGE
            // ================================================

            playerUnsubscribe =
                $(serverPlayer).onChange(
                    () => {

                        // ====================================
                        // NAME
                        // ====================================

                        setPlayerName(
                            serverPlayer.name ||
                            "Player"
                        );


                        // ====================================
                        // ALIVE
                        // ====================================

                        const currentAlive =
                            serverPlayer.alive !== false;


                        setIsDead(
                            !currentAlive
                        );


                        // ====================================
                        // DEAD
                        // ====================================

                        if (!currentAlive) {

                            velocityX.current = 0;
                            velocityZ.current = 0;


                            console.log(
                                "[PLAYER] 💀 Player died"
                            );


                            return;

                        }


                        // ====================================
                        // ALIVE
                        // ====================================

                        console.log(
                            "[PLAYER] ❤️ Player alive"
                        );

                    }
                );

        };


        // ====================================================
        // EXISTING PLAYER
        // ====================================================

        const existingPlayer =
            playersMap.get(
                room.sessionId
            );


        if (existingPlayer) {

            bindLocalPlayer(
                existingPlayer
            );

        }
        else {

            console.log(
                "[PLAYER] Waiting for local player state..."
            );

        }


        // ====================================================
        // PLAYER ADDED
        // ====================================================

        const removeAddListener =
            $(playersMap).onAdd(
                (
                    serverPlayer: any,
                    playerId: string
                ) => {

                    console.log(
                        "[PLAYER] Player added:",
                        playerId
                    );


                    if (
                        playerId !==
                        room.sessionId
                    ) {

                        return;
                    }


                    bindLocalPlayer(
                        serverPlayer
                    );

                }
            );


        // ====================================================
        // CLEANUP
        // ====================================================

        return () => {

            console.log(
                "[PLAYER] Cleaning player listeners"
            );


            playerUnsubscribe?.();

            removeAddListener?.();


            bombEscape.current.clear();

        };

    }, [room]);


    // ========================================================
    // INITIAL SPAWN
    // ========================================================

    useEffect(() => {

        const player =
            playerRef.current;


        if (!player) {
            return;
        }


        // ====================================================
        // NO ROOM
        // ====================================================

        if (!room) {

            player.position.set(
                0,
                0,
                5
            );

            player.rotation.y = 0;

            velocityX.current = 0;
            velocityZ.current = 0;

            return;
        }


        // ====================================================
        // SERVER PLAYER
        // ====================================================

        const serverPlayer =
            room.state?.players?.get(
                room.sessionId
            );


        if (!serverPlayer) {

            console.log(
                "[PLAYER] Waiting for server player..."
            );

            return;
        }


        console.log(
            "[PLAYER] Spawn from server:",
            {
                id:
                    room.sessionId,

                name:
                    serverPlayer.name,

                x:
                    serverPlayer.x,

                y:
                    serverPlayer.y,

                z:
                    serverPlayer.z,

                rotation:
                    serverPlayer.rotation,

                alive:
                    serverPlayer.alive,
            }
        );


        // ====================================================
        // PLAYER NAME
        // ====================================================

        setPlayerName(
            serverPlayer.name ||
            "Player"
        );


        // ====================================================
        // PLAYER ALIVE
        // ====================================================

        setIsDead(
            serverPlayer.alive === false
        );


        // ====================================================
        // POSITION
        // ====================================================

        player.position.set(

            Number(
                serverPlayer.x ?? 0
            ),

            Number(
                serverPlayer.y ?? 0
            ),

            Number(
                serverPlayer.z ?? 0
            )

        );


        // ====================================================
        // ROTATION
        // ====================================================

        player.rotation.y =
            Number(
                serverPlayer.rotation ?? 0
            );


        // ====================================================
        // RESET VELOCITY
        // ====================================================

        velocityX.current = 0;
        velocityZ.current = 0;

        bombEscape.current.clear();

    }, [
        room,
        playerRef,
    ]);


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
        // DEAD
        // ====================================================

        if (isDead) {

            velocityX.current = 0;
            velocityZ.current = 0;

            return;
        }


        // ====================================================
        // JOYSTICK
        // ====================================================

        const {
            x,
            y,
        } =
            useMovementStore.getState();


        // ====================================================
        // JOYSTICK MAGNITUDE
        // ====================================================

        const inputMagnitude =
            Math.sqrt(
                x * x +
                y * y
            );


        // ====================================================
        // DEAD ZONE
        // ====================================================

        const DEAD_ZONE =
            0.08;


        let strength =
            0;


        if (
            inputMagnitude >
            DEAD_ZONE
        ) {

            strength =
                (
                    inputMagnitude -
                    DEAD_ZONE
                ) /
                (
                    1 -
                    DEAD_ZONE
                );


            strength =
                Math.min(
                    1,
                    strength
                );

        }


        // ====================================================
        // CAMERA FORWARD
        // ====================================================

        const cameraDirection =
            camera.getWorldDirection(
                _cameraDirection
            );


        // ====================================================
        // CAMERA FORWARD ON GROUND
        // ====================================================

        let forwardX =
            cameraDirection.x;

        let forwardZ =
            cameraDirection.z;


        const forwardLength =
            Math.sqrt(
                forwardX * forwardX +
                forwardZ * forwardZ
            );


        if (
            forwardLength >
            0.0001
        ) {

            forwardX /=
                forwardLength;

            forwardZ /=
                forwardLength;

        }
        else {

            forwardX = 0;
            forwardZ = -1;

        }


        // ====================================================
        // CAMERA RIGHT
        // ====================================================

        const rightX =
            -forwardZ;

        const rightZ =
            forwardX;


        // ====================================================
        // JOYSTICK → CAMERA SPACE
        // ====================================================

        let moveX =
            rightX * x +
            forwardX * (-y);

        let moveZ =
            rightZ * x +
            forwardZ * (-y);


        // ====================================================
        // NORMALIZE MOVEMENT
        // ====================================================

        const movementLength =
            Math.sqrt(
                moveX * moveX +
                moveZ * moveZ
            );


        if (
            movementLength >
                0.0001 &&
            strength > 0
        ) {

            moveX /=
                movementLength;

            moveZ /=
                movementLength;

        }
        else {

            moveX = 0;
            moveZ = 0;

        }


        // ====================================================
        // SPEED
        // ====================================================

        const MAX_SPEED =
            5.5;


        const targetSpeed =
            MAX_SPEED *
            strength;


        const targetVelocityX =
            moveX *
            targetSpeed;


        const targetVelocityZ =
            moveZ *
            targetSpeed;


        // ====================================================
        // ACCELERATION
        // ====================================================

        const ACCELERATION =
            18;

        const DECELERATION =
            22;


        const acceleration =
            strength > 0
                ? ACCELERATION
                : DECELERATION;


        const step =
            acceleration *
            delta;


        // ====================================================
        // SMOOTH X
        // ====================================================

        const differenceX =
            targetVelocityX -
            velocityX.current;


        if (
            Math.abs(
                differenceX
            ) <= step
        ) {

            velocityX.current =
                targetVelocityX;

        }
        else {

            velocityX.current +=
                Math.sign(
                    differenceX
                ) *
                step;

        }


        // ====================================================
        // SMOOTH Z
        // ====================================================

        const differenceZ =
            targetVelocityZ -
            velocityZ.current;


        if (
            Math.abs(
                differenceZ
            ) <= step
        ) {

            velocityZ.current =
                targetVelocityZ;

        }
        else {

            velocityZ.current +=
                Math.sign(
                    differenceZ
                ) *
                step;

        }


        // ====================================================
        // CURRENT SPEED
        // ====================================================

        const currentSpeed =
            Math.sqrt(
                velocityX.current *
                    velocityX.current +
                velocityZ.current *
                    velocityZ.current
            );


        // ====================================================
        // NEXT POSITION
        // ====================================================

        const nextX =
            player.position.x +
            velocityX.current *
            delta;


        const nextZ =
            player.position.z +
            velocityZ.current *
            delta;


        // ====================================================
        // GET SERVER BOMBS
        // ====================================================

        const serverBombs =
            room?.state?.bombs
                ? Array.from(
                    room.state.bombs.values()
                )
                : [];


        // ====================================================
        // BOMB COLLISION CONSTANTS
        // ====================================================

        const PLAYER_RADIUS =
            0.35;

        const BOMB_RADIUS =
            0.55;

        const BOMB_COLLISION_DISTANCE =
            PLAYER_RADIUS +
            BOMB_RADIUS;


        // ====================================================
        // CHECK BOMB COLLISION
        // ====================================================

        const canMoveAroundBombs =
            (
                targetX: number,
                targetZ: number
            ): boolean => {

                for (
                    const bomb
                    of serverBombs
                ) {

                    const bombId =
                        String(
                            (bomb as any).id
                        );


                    const bombX =
                        Number(
                            (bomb as any).x ?? 0
                        );

                    const bombZ =
                        Number(
                            (bomb as any).z ?? 0
                        );


                    const dx =
                        targetX -
                        bombX;

                    const dz =
                        targetZ -
                        bombZ;


                    const distance =
                        Math.sqrt(
                            dx * dx +
                            dz * dz
                        );


                    // ========================================
                    // PLAYER ĐANG Ở TRONG BOM
                    // ========================================
                    //
                    // Cho phép thoát khỏi bomb.
                    //
                    // ========================================

                    const currentDX =
                        player.position.x -
                        bombX;

                    const currentDZ =
                        player.position.z -
                        bombZ;


                    const currentDistance =
                        Math.sqrt(
                            currentDX *
                                currentDX +
                            currentDZ *
                                currentDZ
                        );


                    if (
                        currentDistance <
                        BOMB_COLLISION_DISTANCE
                    ) {

                        bombEscape.current.add(
                            bombId
                        );

                        continue;

                    }


                    // ========================================
                    // ĐÃ THOÁT BOM
                    // ========================================

                    if (
                        bombEscape.current.has(
                            bombId
                        )
                    ) {

                        /*
                         * Player đã ra khỏi bomb.
                         *
                         * Từ đây bomb trở thành vật cản.
                         */

                        if (
                            currentDistance >
                            BOMB_COLLISION_DISTANCE +
                            0.05
                        ) {

                            bombEscape.current.delete(
                                bombId
                            );

                        }

                    }


                    // ========================================
                    // COLLISION
                    // ========================================

                    if (
                        !bombEscape.current.has(
                            bombId
                        ) &&
                        distance <
                        BOMB_COLLISION_DISTANCE
                    ) {

                        return false;

                    }

                }


                return true;

            };


        // ====================================================
        // COLLISION
        // ====================================================

        if (
            currentSpeed >
            0.001
        ) {

            // ==================================================
            // MOVE X
            // ==================================================

            const canMoveX =
                canMoveTo(
                    nextX,
                    player.position.z
                ) &&
                canMoveAroundBombs(
                    nextX,
                    player.position.z
                );


            if (canMoveX) {

                player.position.x =
                    nextX;

            }
            else {

                velocityX.current = 0;

            }


            // ==================================================
            // MOVE Z
            // ==================================================

            const canMoveZ =
                canMoveTo(
                    player.position.x,
                    nextZ
                ) &&
                canMoveAroundBombs(
                    player.position.x,
                    nextZ
                );


            if (canMoveZ) {

                player.position.z =
                    nextZ;

            }
            else {

                velocityZ.current = 0;

            }

        }


        // ====================================================
        // PLAYER ROTATION
        // ====================================================

        const actualSpeed =
            Math.sqrt(
                velocityX.current *
                    velocityX.current +
                velocityZ.current *
                    velocityZ.current
            );


        if (
            actualSpeed >
            0.05
        ) {

            const directionX =
                velocityX.current /
                actualSpeed;

            const directionZ =
                velocityZ.current /
                actualSpeed;


            player.rotation.y =
                Math.atan2(
                    directionX,
                    directionZ
                );

        }


        // ====================================================
        // MULTIPLAYER
        // ====================================================

        if (
            room &&
            actualSpeed >
            0.001
        ) {

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
                name={playerName}
            />

        </group>

    );

}
