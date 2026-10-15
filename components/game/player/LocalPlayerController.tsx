"use client";

import {
    useEffect,
    useRef,
    useState,
    type RefObject,
} from "react";
import { useAimStore } from "@/stores/aim.store";
import {
    useFrame,
    useThree,
} from "@react-three/fiber";
import { useRunStore } from "@/stores/run.store";
import {
    Vector2,
    Vector3,
    Raycaster,
    type Group,
    type Bone,
    type Object3D,
} from "three";
import { useCrouchStore } from "@/stores/crouch.store";
import { useJumpStore } from "@/stores/jump.store";
import {
    getStateCallbacks,
} from "@colyseus/sdk";
import {
    doorCellKey,
} from "../../../shared/maps/doors";
import {
    getMapConfig,
} from "../../../shared/maps/map-registry";
import Player from "./Player";
import { useCrosshairStore } from "@/stores/crosshair.store";
import {
    useMovementStore,
} from "@/stores/movement.store";
import { useCameraViewStore } from "@/stores/camera-view.store";
import {
    useMultiplayerStore,
} from "@/stores/multiplayer.store";

import {
    moveWithWallCollision,
} from "../../../shared/maps/grid-map";
// ============================================================
// CAMERA DIRECTION CACHE
// ============================================================
const _cameraDirection = new Vector3();

// Đẩy tâm ngắm lên cao hơn đầu nhân vật 0.25 đơn vị.
// ============================================================
// TYPES
// ============================================================

type Props = {
    playerRef: RefObject<Group | null>;
};
function findHeadBone(root: Group): Bone | null {
    let head: Bone | null = null;

    root.traverse((object) => {
        if (!head && (object as Bone).isBone) {
            const name = object.name
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "");

            if (
                name === "head" ||
                name.endsWith("head")
            ) {
                head = object as Bone;
            }
        }
    });

    return head;
}

// ============================================================
// LOCAL PLAYER CONTROLLER
// ============================================================

export default function LocalPlayerController({
    playerRef,
}: Props) {

    const {
        camera,
    } = useThree();

const running = useRunStore((state) => state.running);

    // ========================================================
    // MULTIPLAYER
    // ========================================================

    const room =
        useMultiplayerStore(
            (state) =>
                state.room
        );

const firstPerson = useCameraViewStore(
    (state) => state.firstPerson
);
    // ========================================================
    // PLAYER NAME
    // ========================================================
const mapId = room?.state?.mapId ?? "tropical-village";
    const [
        playerName,
        setPlayerName,
    ] = useState("Player");


const [weapon1, setWeapon1] = useState("");
const [weapon2, setWeapon2] = useState("");
const [equippedSlot, setEquippedSlot] = useState(0);

const aimTargetRef = useRef(new Vector3());
const shotDirectionRef = useRef(new Vector3());
const muzzlePositionRef = useRef(new Vector3());
const muzzleObjectRef = useRef<Object3D | null>(null);
const raycasterRef = useRef(new Raycaster());
const crosshairNdcRef = useRef(new Vector2());
const weaponType =
    equippedSlot === 1
        ? weapon1
        : equippedSlot === 2
            ? weapon2
            : "";
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
const targetRotation = useRef(0);

    // ========================================================
    // MOVING STATE
    // ========================================================
    //
    // true:
    //     Character đang di chuyển
    //
    // false:
    //     Character đứng yên
    //
    // isMovingRef dùng để tránh setState mỗi frame.
    //
    // ========================================================

    const isCrouching = useCrouchStore(
    (state) => state.crouching,
);
const getClosedDoorCells = (): Set<string> => {
    const blocked = new Set<string>();

    const doors = room?.state?.doors;

    if (!doors) {
        return blocked;
    }

    doors.forEach((door: any) => {
        if (!door.open) {
            blocked.add(
                doorCellKey(
                    Number(door.cellX),
                    Number(door.cellZ),
                ),
            );
        }
    });

    return blocked;
};
const jumpTrigger = useJumpStore(
    (state) => state.jumpTrigger,
);

    const isMovingRef =
        useRef(false);
const lastSentMoving = useRef<boolean | null>(null);
    const [
        isMoving,
        setIsMoving,
    ] = useState(false);


    // ========================================================
    // BOMB ESCAPE
    // ========================================================

    const bombEscape =
        useRef<
            Set<string>
        >(
            new Set()
        );


    // ========================================================
    // LAST SERVER ALIVE
    // ========================================================
    //
    // Dùng để phát hiện:
    //
    // true → false = chết
    //
    // false → true = respawn
    //
    // Không snap position mỗi lần server state thay đổi.
    //
    // ========================================================

    const lastServerAlive =
        useRef<boolean | null>(
            null
        );


    // ========================================================
    // RESET LOCAL POSITION FROM SERVER
    // ========================================================

    const resetPositionFromServer = (
        serverPlayer: any
    ) => {

        const player =
            playerRef.current;


        if (
            !player ||
            !serverPlayer
        ) {
            return;
        }

        const x =
            Number(
                serverPlayer.x ?? 0
            );

        const y =
            Number(
                serverPlayer.y ?? 0
            );

        const z =
            Number(
                serverPlayer.z ?? 0
            );

        const rotation =
            Number(
                serverPlayer.rotation ?? 0
            );


        // ====================================================
        // RESET POSITION
        // ====================================================

        player.position.set(
            x,
            y,
            z
        );


        // ====================================================
        // RESET ROTATION
        // ====================================================

        player.rotation.y =
            rotation;

targetRotation.current = rotation;
        // ====================================================
        // RESET MOVEMENT
        // ====================================================

        velocityX.current =
            0;

        velocityZ.current =
            0;


        // ====================================================
        // RESET CHARACTER ANIMATION
        // ====================================================

        isMovingRef.current =
            false;

        setIsMoving(
            false
        );


        // ====================================================
        // RESET BOMB ESCAPE
        // ====================================================

        bombEscape.current.clear();


        console.log(
            "[PLAYER] 📍 Local position synced:",
            {
                x,
                y,
                z,
                rotation,
            }
        );

    };


    // ========================================================
    // REALTIME PLAYER STATE
    // ========================================================

    useEffect(() => {

        if (!room) {
setWeapon1("");
setWeapon2("");
setEquippedSlot(0);
            console.log(
                "[PLAYER] ❌ No Colyseus room"
            );


            setPlayerName(
                "Player"
            );


            setIsDead(
                false
            );


            lastServerAlive.current =
                null;


            velocityX.current =
                0;

            velocityZ.current =
                0;


            isMovingRef.current =
                false;

            setIsMoving(
                false
            );


            return;

        }


        console.log(
            "========================================"
        );

        console.log(
            "[PLAYER] 🔄 NEW ROOM"
        );
setWeapon1("");
setWeapon2("");
setEquippedSlot(0);
        console.log(
            "[PLAYER] roomId:",
            room.roomId
        );

        console.log(
            "[PLAYER] sessionId:",
            room.sessionId
        );


        /*
         * QUAN TRỌNG:
         *
         * Mỗi room mới phải reset toàn bộ
         * local player state.
         */

        setPlayerName(
            "Player"
        );

        setIsDead(
            false
        );

        lastServerAlive.current =
            null;

        velocityX.current =
            0;

        velocityZ.current =
            0;

        isMovingRef.current =
            false;

        setIsMoving(
            false
        );

        bombEscape.current.clear();


        // ====================================================
        // PLAYERS MAP
        // ====================================================

        const playersMap =
            room.state?.players;


        if (!playersMap) {

            console.warn(
                "[PLAYER] ❌ players map not ready"
            );

            return;

        }


        const $ =
            getStateCallbacks(
                room
            );


        let playerUnsubscribe:
            (() => void) | undefined;


        // ====================================================
        // BIND LOCAL PLAYER
        // ====================================================

        const bindLocalPlayer =
            (
                serverPlayer: any
            ) => {

                if (!serverPlayer) {

                    console.warn(
                        "[PLAYER] ❌ Local player is null"
                    );

                    return;

                }


                console.log(
                    "[PLAYER] ✅ Local player bound:",
                    {
                        roomId:
                            room.roomId,

                        sessionId:
                            room.sessionId,

                        id:
                            serverPlayer.id,

                        name:
                            serverPlayer.name,

                        hp:
                            serverPlayer.hp,

                        alive:
                            serverPlayer.alive,

                        x:
                            serverPlayer.x,

                        y:
                            serverPlayer.y,

                        z:
                            serverPlayer.z,

                        rotation:
                            serverPlayer.rotation,
                    }
                );


                // ================================================
                // NAME
                // ================================================

                setPlayerName(
                    serverPlayer.name ||
                    "Player"
                );
setWeapon1(serverPlayer.weapon1 || "");
setWeapon2(serverPlayer.weapon2 || "");
setEquippedSlot(
    Number(serverPlayer.equippedSlot || 0),
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
                // INITIAL POSITION
                // ================================================

                if (
                    lastServerAlive.current ===
                    null
                ) {

                    lastServerAlive.current =
                        alive;


                    if (alive) {

                        resetPositionFromServer(
                            serverPlayer
                        );

                    }

                }


                // ================================================
                // REMOVE OLD LISTENER
                // ================================================

                playerUnsubscribe?.();


                // ================================================
                // LISTEN PLAYER CHANGES
                // ================================================

                playerUnsubscribe =
                    $(
                        serverPlayer
                    ).onChange(
                        () => {

                            // ====================================
                            // NAME
                            // ====================================

                            setPlayerName(
                                serverPlayer.name ||
                                "Player"
                            );

// ================================================
// WEAPON STATE
// ================================================

setWeapon1(serverPlayer.weapon1 || "");
setWeapon2(serverPlayer.weapon2 || "");
setEquippedSlot(Number(serverPlayer.equippedSlot || 0));
                            // ====================================
                            // ALIVE
                            // ====================================

                            const currentAlive =
                                serverPlayer.alive !== false;


                            const previousAlive =
                                lastServerAlive.current;


                            lastServerAlive.current =
                                currentAlive;


                            // ====================================
                            // DEAD
                            // ====================================

                            if (
                                !currentAlive
                            ) {

                                setIsDead(
                                    true
                                );


                                velocityX.current =
                                    0;

                                velocityZ.current =
                                    0;


                                // =================================
                                // STOP CHARACTER ANIMATION
                                // =================================

                                if (
                                    isMovingRef.current
                                ) {

                                    isMovingRef.current =
                                        false;

                                    setIsMoving(
                                        false
                                    );

                                }


                                console.log(
                                    "[PLAYER] 💀 Local player died"
                                );


                                return;

                            }


                            // ====================================
                            // RESPAWN
                            // ====================================

                            if (
                                previousAlive ===
                                    false &&
                                currentAlive ===
                                    true
                            ) {

                                console.log(
                                    "[PLAYER] ❤️ Local player respawned"
                                );


                                resetPositionFromServer(
                                    serverPlayer
                                );

                            }


                            // ====================================
                            // ALIVE
                            // ====================================

                            setIsDead(
                                false
                            );

                        }
                    );

            };


        // ====================================================
        // FIND LOCAL PLAYER
        // ====================================================

        const findLocalPlayer =
            () => {

                const localPlayer =
                    playersMap.get(
                        room.sessionId
                    );


                if (
                    localPlayer
                ) {

                    console.log(
                        "[PLAYER] 🎯 Found local player:",
                        {
                            roomId:
                                room.roomId,

                            sessionId:
                                room.sessionId,

                            id:
                                localPlayer.id,

                            name:
                                localPlayer.name,

                            hp:
                                localPlayer.hp,

                            alive:
                                localPlayer.alive,
                        }
                    );


                    bindLocalPlayer(
                        localPlayer
                    );


                    return true;

                }


                return false;

            };


        // ====================================================
        // EXISTING PLAYER
        // ====================================================

        if (
            !findLocalPlayer()
        ) {

            console.log(
                "[PLAYER] ⏳ Waiting for local player..."
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
                        "[PLAYER] ➕ Player added:",
                        {
                            roomId:
                                room.roomId,

                            playerId,

                            localSession:
                                room.sessionId,
                        }
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
                "[PLAYER] 🧹 Cleaning room listeners:",
                {
                    roomId:
                        room.roomId,

                    sessionId:
                        room.sessionId,
                }
            );


            playerUnsubscribe?.();

            removeAddListener?.();


            bombEscape.current.clear();


            lastServerAlive.current =
                null;


            isMovingRef.current =
                false;

        };

    }, [
        room,
    ]);


    // ========================================================
    // INITIAL SPAWN
    // ========================================================

    useEffect(() => {

        const player =
            playerRef.current;


        if (!player) {
            return;
            // Cập nhật tia ngắm qua chính giữa màn hình.


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

            player.rotation.y =
                0;
targetRotation.current = 0;
            velocityX.current =
                0;

            velocityZ.current =
                0;

            lastServerAlive.current =
                null;


            isMovingRef.current =
                false;

            setIsMoving(
                false
            );


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

        const alive =
            serverPlayer.alive !== false;


        setIsDead(
            !alive
        );


        lastServerAlive.current =
            alive;


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

targetRotation.current = player.rotation.y;
        // ====================================================
        // RESET VELOCITY
        // ====================================================

        velocityX.current =
            0;

        velocityZ.current =
            0;


        // ====================================================
        // RESET CHARACTER ANIMATION
        // ====================================================

        isMovingRef.current =
            false;

        setIsMoving(
            false
        );


        // ====================================================
        // RESET BOMB ESCAPE
        // ====================================================

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
// ================================================
// AIM FROM ACTUAL CHARACTER HEAD
// ================================================

// ====================================================
// CROSSHAIR: FIXED SCREEN POSITION
// ====================================================

// Giữ tâm ngắm ở vị trí cố định trên màn hình.
// 0.5 = chính giữa; 0.65 = lệch phải 15% chiều rộng.
const CROSSHAIR_X = 0.55;
const CROSSHAIR_Y = 0.70;

const crosshairStore = useCrosshairStore.getState();

crosshairStore.setPosition(
    CROSSHAIR_X,
    CROSSHAIR_Y,
    !isDead,
);

// ====================================================
// AIM RAY: CAMERA THROUGH CROSSHAIR
// ====================================================

// Chuyển tọa độ màn hình [0, 1] sang NDC [-1, 1].
// Trục Y bị đảo vì tọa độ màn hình tăng từ trên xuống.
const crosshairNdc = crosshairNdcRef.current.set(
    CROSSHAIR_X * 2 - 1,
    1 - CROSSHAIR_Y * 2,
);

const raycaster = raycasterRef.current;
raycaster.setFromCamera(crosshairNdc, camera);

// Hướng bắn đi qua đúng vị trí tâm ngắm.
const shotOrigin = camera.getWorldPosition(
    new Vector3(),
);

const shotDirection = raycaster.ray.direction;

useAimStore.getState().setAim(
    {
        x: shotOrigin.x,
        y: shotOrigin.y,
        z: shotOrigin.z,
    },
    {
        x: shotDirection.x,
        y: shotDirection.y,
        z: shotDirection.z,
    },
);


        // ====================================================
        // DEAD
        // ====================================================

        if (isDead) {

            velocityX.current =
                0;

            velocityZ.current =
                0;


            if (
                isMovingRef.current
            ) {

                isMovingRef.current =
                    false;

                setIsMoving(
                    false
                );

            }


            return;

        }


        // ====================================================
        // JOYSTICK
        // ====================================================

    
let {
    x,
    y,
} = useMovementStore.getState();

// Chuyển input màn hình dọc về hệ tọa độ game.
// Chỉ đổi trục khi màn hình vật lý đang ở portrait.
const isPortrait =
    typeof window !== "undefined" &&
    window.innerHeight > window.innerWidth;

if (isPortrait) {
    const screenX = x;
    const screenY = y;

    x = screenY;
    y = -screenX;
}

// Bấm CHẠY: tự tiến về phía trước nếu không đẩy joystick.
const DEAD_ZONE = 0.08;

const joystickMagnitude = Math.hypot(x, y);

if (running && joystickMagnitude <= DEAD_ZONE) {
    x = 0;
    y = -1;
}
        // ====================================================
        // PORTRAIT INPUT
        // ====================================================
        //
        // LandscapeGuard xoay toàn bộ game 90° khi portrait.
        //
        // Vì vậy input vật lý trên màn hình portrait cần
        // chuyển về hệ tọa độ game trước khi đưa vào
        // camera-relative movement.
        //
        // ====================================================


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

            forwardX =
                0;

            forwardZ =
                -1;

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

            moveX =
                0;

            moveZ =
                0;

        }


        // ====================================================
        // SPEED
        // ====================================================

const WALK_SPEED = 5.5;
const RUN_SPEED = 9.0;
const CROUCH_SPEED = 2.5;

const MAX_SPEED = isCrouching
    ? CROUCH_SPEED
    : running
        ? RUN_SPEED
        : WALK_SPEED;

const targetSpeed = MAX_SPEED * strength;
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
        // SERVER BOMBS
        // ====================================================

        const serverBombs =
            room?.state?.bombs
                ? Array.from(
                    room.state.bombs.values()
                )
                : [];


        // ====================================================
        // BOMB COLLISION
        // ====================================================

        const PLAYER_RADIUS =
            0.35;

        const BOMB_RADIUS =
            0.55;

        const BOMB_COLLISION_DISTANCE =
            PLAYER_RADIUS +
            BOMB_RADIUS;


        // ====================================================
        // CAN MOVE AROUND BOMBS
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
                    // CURRENT DISTANCE
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


                    // ========================================
                    // PLAYER INSIDE BOMB
                    // ========================================

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
                    // EXITED BOMB
                    // ========================================

                    if (
                        bombEscape.current.has(
                            bombId
                        )
                    ) {

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
        // COLLISION + WALL SLIDING
        // ====================================================

        if (currentSpeed > 0.00000000000001) {
            const currentX = player.position.x;
            const currentZ = player.position.z;

            const dx = velocityX.current * delta;
            const dz = velocityZ.current * delta;

            const targetX = currentX + dx;
            const targetZ = currentZ + dz;
const activeMap = getMapConfig(mapId);
const blockedDoorCells = getClosedDoorCells();

            // Chỉ xử lý va chạm một lần.
            // Hàm này tự thử di chuyển chéo và trượt dọc tường.
            const result = moveWithWallCollision(
                    activeMap,
                currentX,
                currentZ,
                targetX,
                targetZ,
                0.4,
                blockedDoorCells,

            );

            player.position.x = result.x;
            player.position.z = result.z;

            const movedX =
                Math.abs(result.x - currentX) > 0.00001;

            const movedZ =
                Math.abs(result.z - currentZ) > 0.00001;

            // Nếu bị chặn hoàn toàn theo một trục,
            // xóa vận tốc ở trục đó nhưng giữ vận tốc trượt.
            if (
                !movedX &&
                Math.abs(dx) > 0.00001
            ) {
                velocityX.current = 0;
            }

            if (
                !movedZ &&
                Math.abs(dz) > 0.00001
            ) {
                velocityZ.current = 0;
            }
        }



   // ====================================================
// MOVEMENT ANIMATION
// ====================================================

// Nhân vật vẫn chạy animation khi người chơi giữ joystick,
// kể cả lúc bị góc tường chặn hoàn toàn.
const hasMovementInput = strength > 0.08;

const actualSpeed = Math.hypot(
    velocityX.current,
    velocityZ.current,
);

const nextMoving = hasMovementInput || actualSpeed > 0.1;

        if (
            nextMoving !==
            isMovingRef.current
        ) {

            isMovingRef.current =
                nextMoving;

            setIsMoving(
                nextMoving
            );

        }


    
/* ====================================================
   PLAYER ROTATION
   Giữ hướng joystick khi va chạm với tường.
==================================================== */

if (hasMovementInput) {
    // Lấy hướng điều khiển ban đầu, không dùng vận tốc
    // đã bị thay đổi bởi xử lý va chạm.
    targetRotation.current = Math.atan2(
        moveX,
        moveZ,
    );
}

// Xoay theo góc ngắn nhất để tránh giật khi qua ±PI.
const angleDifference = Math.atan2(
    Math.sin(targetRotation.current - player.rotation.y),
    Math.cos(targetRotation.current - player.rotation.y),
);

// Nội suy góc xoay để chuyển hướng mượt hơn.
player.rotation.y +=
    angleDifference *
    (1 - Math.exp(-12 * delta));


        // ====================================================
        // MULTIPLAYER
        // ====================================================

  if (room) {
    const shouldSendMovement =
        actualSpeed > 0.001 ||
        lastSentMoving.current !== nextMoving;

    if (shouldSendMovement) {
        room.send("move", {
            x: player.position.x,
            y: player.position.y,
            z: player.position.z,
            rotation: player.rotation.y,
            moving: nextMoving,
        });

        lastSentMoving.current = nextMoving;
    }
}

    });


    // ========================================================
    // PLAYER
    // ========================================================

return (
    <group ref={playerRef}>
        <group visible={!firstPerson}>
            <Player
                position={[0, 0, 0]}
                name={playerName}
                moving={isMoving}
                running={running && isMoving && !isCrouching}
                crouching={isCrouching}
                jumpTrigger={jumpTrigger}
                weaponType={weaponType}
            />
        </group>
    </group>
);

}