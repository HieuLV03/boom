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
            (state) => state.room
        );


    // ========================================================
    // HP
    // ========================================================

    const [
        hp,
        setHp,
    ] = useState(100);


    // ========================================================
    // VELOCITY
    // ========================================================

    const velocityX =
        useRef(0);

    const velocityZ =
        useRef(0);


    // ========================================================
    // REALTIME HP
    // ========================================================

    useEffect(() => {

        if (!room) {
            console.log(
                "[PLAYER] No Colyseus room"
            );

            return;
        }


        console.log(
            "[PLAYER] HP listener connected"
        );

        console.log(
            "[PLAYER] Session ID:",
            room.sessionId
        );


        // ====================================================
        // DIRECT DAMAGE MESSAGE
        // ====================================================

        const removeDamagedListener =
            room.onMessage(
                "playerDamaged",
                (
                    message: {
                        playerId?: string;
                        damage?: number;
                        hp?: number;
                        alive?: boolean;
                        distance?: number;
                        bombId?: string;
                    }
                ) => {

                    console.log(
                        "[PLAYER] playerDamaged received:",
                        message
                    );


                    /*
                     * Chỉ xử lý damage của
                     * chính local player.
                     */

                    if (
                        message?.playerId !==
                        room.sessionId
                    ) {
                        return;
                    }


                    const newHp =
                        Number(
                            message.hp ?? 0
                        );


                    const safeHp =
                        Math.max(
                            0,
                            Math.min(
                                100,
                                newHp
                            )
                        );


                    console.log(
                        "[PLAYER] ❤️ HP:",
                        safeHp
                    );


                    setHp(
                        safeHp
                    );

                }
            );


        // ====================================================
        // STATE SYNC FALLBACK
        // ====================================================

        const playersMap =
            room.state?.players;


        if (!playersMap) {

            console.warn(
                "[PLAYER] room.state.players not found"
            );

            return () => {

                removeDamagedListener?.();

            };
        }


        const $ =
            getStateCallbacks(room);


        let hpUnsubscribe:
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
                "[PLAYER] Initial HP:",
                serverPlayer.hp
            );


            // ================================================
            // INITIAL HP
            // ================================================

            const initialHp =
                Number(
                    serverPlayer.hp ?? 100
                );


            const safeInitialHp =
                Math.max(
                    0,
                    Math.min(
                        100,
                        initialHp
                    )
                );


            setHp(
                safeInitialHp
            );


            // ================================================
            // REMOVE OLD LISTENER
            // ================================================

            hpUnsubscribe?.();


            // ================================================
            // STATE CHANGE
            // ================================================

            hpUnsubscribe =
                $(serverPlayer).onChange(
                    () => {

                        const currentHp =
                            Number(
                                serverPlayer.hp ??
                                0
                            );


                        const safeHp =
                            Math.max(
                                0,
                                Math.min(
                                    100,
                                    currentHp
                                )
                            );


                        console.log(
                            "[PLAYER] HP STATE CHANGE:",
                            safeHp
                        );


                        setHp(
                            safeHp
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

        } else {

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
                "[PLAYER] Cleaning HP listeners"
            );


            removeDamagedListener?.();

            hpUnsubscribe?.();

            removeAddListener?.();

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
        // SERVER SPAWN
        // ====================================================

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


        // ====================================================
        // LOCAL SPAWN
        // ====================================================

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

        const DEAD_ZONE = 0.08;

        let strength = 0;


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

        } else {

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
        // JOYSTICK -> CAMERA SPACE
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

        } else {

            moveX = 0;

            moveZ = 0;
        }


        // ====================================================
        // SPEED
        // ====================================================

        const MAX_SPEED = 5.5;

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

        const ACCELERATION = 18;

        const DECELERATION = 22;


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
            Math.abs(differenceX) <=
            step
        ) {

            velocityX.current =
                targetVelocityX;

        } else {

            velocityX.current +=
                Math.sign(differenceX) *
                step;
        }


        // ====================================================
        // SMOOTH Z
        // ====================================================

        const differenceZ =
            targetVelocityZ -
            velocityZ.current;


        if (
            Math.abs(differenceZ) <=
            step
        ) {

            velocityZ.current =
                targetVelocityZ;

        } else {

            velocityZ.current +=
                Math.sign(differenceZ) *
                step;
        }


        // ====================================================
        // APPLY MOVEMENT
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
            0.001
        ) {

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
                    directionX,
                    directionZ
                );
        }


        // ====================================================
        // MULTIPLAYER
        // ====================================================

        if (
            room &&
            currentSpeed >
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
                hp={hp}
            />

        </group>
    );
}