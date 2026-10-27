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

import * as THREE from "three";
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
import { useAimingStore } from "@/stores/aiming.store";
import Player from "./Player";
import { useCrosshairStore } from "@/stores/crosshair.store";
import {
    useMovementStore,
} from "@/stores/movement.store";
import { useCameraViewStore } from "@/stores/camera-view.store";
import {
    useMultiplayerStore,
} from "@/stores/multiplayer.store";

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

const { camera, scene } = useThree();

const collisionRaycasterRef = useRef(new Raycaster());
const hospitalModelRef = useRef<Object3D | null>(null);
const running = useRunStore((state) => state.running);
const aiming = useAimingStore(
    (state) => state.aiming,
);
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
const mapId = room?.state?.mapId ?? "hospital";
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
        const serverYRef = useRef(0);
const targetRotation = useRef(0);
// Ưu tiên hướng tâm ngắm trong thời gian ngắn sau khi tấn công.
const attackAimUntilRef = useRef(0);

// Theo dõi góc đã gửi lên server.
const lastSentRotation = useRef<number | null>(null);
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
const [movingBackward, setMovingBackward] = useState(false);
const movingBackwardRef = useRef(false);

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

serverYRef.current = y;
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

// Độ cao chân nhân vật do server quản lý.
const serverY = Number(serverPlayer.y);

if (Number.isFinite(serverY)) {
    serverYRef.current = serverY;
}
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

useEffect(() => {
    const handleAttackAim = (event: Event) => {
        const customEvent = event as CustomEvent<{
            direction?: {
                x: number;
                y: number;
                z: number;
            };
        }>;

        const direction = customEvent.detail?.direction;

        if (
            !direction ||
            !Number.isFinite(direction.x) ||
            !Number.isFinite(direction.z)
        ) {
            return;
        }

        // Chỉ lấy hướng ngang, không cho thân nhân vật nghiêng lên/xuống.
        if (Math.hypot(direction.x, direction.z) < 0.0001) {
            return;
        }

        targetRotation.current = Math.atan2(
            direction.x,
            direction.z,
        );

        // Tạm ưu tiên hướng ngắm hơn hướng joystick.
        attackAimUntilRef.current = Date.now() + 500;
    };

    window.addEventListener(
        "boom:attack-aim",
        handleAttackAim,
    );

    return () => {
        window.removeEventListener(
            "boom:attack-aim",
            handleAttackAim,
        );
    };
}, []);
    // ========================================================
    // INITIAL SPAWN
    // ========================================================

useEffect(() => {
    const handleRequestBullet = (event: Event) => {
        const customEvent = event as CustomEvent<{
            origin?: { x: number; y: number; z: number };
            direction?: { x: number; y: number; z: number };
            range?: number;
            weapon?: string;
        }>;

        const data = customEvent.detail;
        const player = playerRef.current;

        if (!player || !data?.origin || !data?.direction) {
            return;
        }

        const values = [
            data.origin.x,
            data.origin.y,
            data.origin.z,
            data.direction.x,
            data.direction.y,
            data.direction.z,
        ];

        if (!values.every(Number.isFinite)) return;

        const maxRange = THREE.MathUtils.clamp(
            Number(data.range ?? 51),
            0.01,
            51,
        );

        const cameraOrigin = new Vector3(
            data.origin.x,
            data.origin.y,
            data.origin.z,
        );

        const cameraDirection = new Vector3(
            data.direction.x,
            data.direction.y,
            data.direction.z,
        );

        if (cameraDirection.lengthSq() < 0.000001) return;

        cameraDirection.normalize();

        // 1. Raycast từ camera xuyên qua đúng tâm crosshair.
        // Nếu có bề mặt ở gần thì ngắm bề mặt gần;
        // nếu bề mặt ở xa thì ngắm đúng điểm xa đó.
        const aimRay = raycasterRef.current;
        aimRay.set(cameraOrigin, cameraDirection);
        aimRay.near = 0;
        aimRay.far = maxRange;

        player.updateMatrixWorld(true);
        scene.updateMatrixWorld(true);

        const hits = aimRay.intersectObjects(scene.children, true);

        // Loại bỏ mọi mesh thuộc nhân vật của chính mình.
        const firstHit = hits.find((hit) => {
            let object: Object3D | null = hit.object;

            while (object) {
                if (object === player) return false;
                object = object.parent;
            }

            return true;
        });

        // Nếu tia ngắm không gặp gì, dùng điểm cuối tầm ngắm.
    // Điểm ngắm chuẩn trên tia camera.
const aimPoint = firstHit
    ? firstHit.point.clone()
    : cameraOrigin
        .clone()
        .addScaledVector(cameraDirection, maxRange);

// Nếu camera nhìn vào tường rất gần, đẩy điểm ngắm
// vào trong một khoảng nhỏ để tránh sai số giao mặt.
if (firstHit && firstHit.distance < 2) {
    aimPoint.addScaledVector(cameraDirection, -0.015);
}
        // 2. Lấy vị trí nòng súng sau khi cập nhật transform.
        let muzzle: Object3D | null = null;

        const muzzleNames = new Set([
            "muzzlepoint",
            "muzzletip",
            "muzzleend",
            "barrelend",
            "firepoint",
            "muzzle",
        ]);

        player.traverse((object) => {
            const normalizedName = object.name
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "");

            if (!muzzle && muzzleNames.has(normalizedName)) {
                muzzle = object;
            }
        });

        const origin = new Vector3();

        if (muzzle) {
            (muzzle as Object3D).getWorldPosition(origin);
        } else {
            // Fallback khi model súng không có marker nòng.
            const yaw = player.rotation.y;

            origin.set(
                player.position.x + Math.sin(yaw) * 0.65,
                player.position.y + 1.35,
                player.position.z + Math.cos(yaw) * 0.65,
            );
        }

        // 3. Đường đạn là đường thẳng từ nòng súng đến aimPoint.
        const direction = aimPoint.clone().sub(origin);

        if (direction.lengthSq() < 0.000001) return;

        direction.normalize();

        const trajectory = {
            origin: {
                x: origin.x,
                y: origin.y,
                z: origin.z,
            },
            direction: {
                x: direction.x,
                y: direction.y,
                z: direction.z,
            },
            target: {
                x: aimPoint.x,
                y: aimPoint.y,
                z: aimPoint.z,
            },
            distance: maxRange,
            range: maxRange,
            weapon: data.weapon ?? "rifle",
        };

        window.dispatchEvent(
            new CustomEvent("boom:bullet-fired", {
                detail: trajectory,
            }),
        );

        window.dispatchEvent(
            new CustomEvent("boom:bullet-trajectory", {
                detail: trajectory,
            }),
        );
    };

    window.addEventListener("boom:request-bullet", handleRequestBullet);

    return () => {
        window.removeEventListener(
            "boom:request-bullet",
            handleRequestBullet,
        );
    };
}, [playerRef, camera, scene]);


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


const lastSyncedRoomRef = useRef<typeof room>(null);
const lastSentCrouchRef = useRef<boolean | null>(null);
const lastSentJumpRef = useRef(0);

useEffect(() => {
    if (!room) {
        lastSyncedRoomRef.current = null;
        lastSentCrouchRef.current = null;
        lastSentJumpRef.current = jumpTrigger;
        return;
    }

    // Phòng mới: đồng bộ trạng thái cúi hiện tại,
    // nhưng không phát lại cú nhảy từ phòng trước.
    if (lastSyncedRoomRef.current !== room) {
        lastSyncedRoomRef.current = room;
        lastSentCrouchRef.current = isCrouching;
        lastSentJumpRef.current = jumpTrigger;

        room.send("crouch", {
            crouching: isCrouching,
        });

        return;
    }

    // Chỉ gửi khi trạng thái cúi thay đổi.
    if (lastSentCrouchRef.current !== isCrouching) {
        room.send("crouch", {
            crouching: isCrouching,
        });

        lastSentCrouchRef.current = isCrouching;
    }

    // Mỗi lần triggerJump tăng, gửi một tín hiệu nhảy.
    if (jumpTrigger !== lastSentJumpRef.current) {
        lastSentJumpRef.current = jumpTrigger;
        room.send("jump");
    }
}, [room, isCrouching, jumpTrigger]);

useEffect(() => {
    let hospital: Object3D | null = null;

    scene.traverse((object) => {
        if (object.userData.isHospitalModel === true) {
            hospital = object;
        }
    });

    hospitalModelRef.current = hospital;

    console.log(
        "[Collision] Hospital found:",
        hospitalModelRef.current !== null,
    );

    return () => {
        hospitalModelRef.current = null;
    };
}, [scene]);

const canMoveAgainstHospital = (
    targetX: number,
    targetZ: number,
    feetY: number,
    radius = 0.4,
): boolean => {
    const hospital = hospitalModelRef.current;
    const player = playerRef.current;

    if (!hospital || !player) return true;

    hospital.updateMatrixWorld(true);

    const dx = targetX - player.position.x;
    const dz = targetZ - player.position.z;
    const distance = Math.hypot(dx, dz);

    if (distance < 0.0001) return true;

    const direction = new Vector3(
        dx / distance,
        0,
        dz / distance,
    );

    const perpendicular = new Vector3(
        -direction.z,
        0,
        direction.x,
    );

    const raycaster = collisionRaycasterRef.current;
    const sideOffsets = [-radius, 0, radius];
    const heights = [0.35, 0.9, 1.45];

    for (const side of sideOffsets) {
        for (const height of heights) {
            const origin = new Vector3(
                player.position.x + perpendicular.x * side,
                feetY + height,
                player.position.z + perpendicular.z * side,
            );

            raycaster.set(origin, direction);
            raycaster.near = 0.01;
            raycaster.far = distance + radius;

            const hits = raycaster.intersectObject(hospital, true);

            // Bỏ qua các mesh nằm dưới chân nhân vật.
            const wallHit = hits.some((hit) => {
                const object = hit.object;

                if (!(object instanceof THREE.Mesh)) {
                    return false;
                }

                return Math.abs(hit.point.y - (feetY + height)) < 0.8;
            });

            if (wallHit) return false;
        }
    }

    return true;
};
    // ========================================================
    // MOVEMENT
    // ========================================================

    useFrame((_, delta) => {

        const player =
            playerRef.current;


        if (!player) {
            return;
        }

        // Đồng bộ độ cao theo server.
// X/Z vẫn dùng hệ thống di chuyển hiện tại.
const targetY = serverYRef.current;

if (Number.isFinite(targetY)) {
    player.position.y = THREE.MathUtils.damp(
        player.position.y,
        targetY,
        18,
        Math.min(delta, 0.05),
    );
}

// ================================================
// AIM FROM ACTUAL CHARACTER HEAD
// ================================================


        // ================================================
        // AIM / CROSSHAIR — LANDSCAPE ONLY
        // ================================================

     
const CROSSHAIR_X = 0.54;
const CROSSHAIR_Y = 0.70;

// Offset phải giống hệt vị trí hiển thị trong GameHUD.
const CROSSHAIR_OFFSET_X = 0.039;
const CROSSHAIR_OFFSET_Y = 0.039;

const effectiveX = CROSSHAIR_X - CROSSHAIR_OFFSET_X;
const effectiveY = CROSSHAIR_Y - CROSSHAIR_OFFSET_Y;

useCrosshairStore.getState().setPosition(
    CROSSHAIR_X,
    CROSSHAIR_Y,
    !isDead,
);

const crosshairNdc = crosshairNdcRef.current.set(
    effectiveX * 2 - 1,
    1 - effectiveY * 2,
);

const raycaster = raycasterRef.current;
raycaster.setFromCamera(crosshairNdc, camera);

const shotOrigin = camera.getWorldPosition(new Vector3());
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

    
let { x, y } = useMovementStore.getState();
// Bấm CHẠY: tự tiến về phía trước nếu không đẩy joystick.
const DEAD_ZONE = 0.08;

const joystickMagnitude = Math.hypot(x, y);

if (running && joystickMagnitude <= DEAD_ZONE) {
    x = 0;
    y = -1;
}
        // ====================================================
        // ====================================================
        //
        //
        // chuyển về hệ tọa độ game trước khi đưa vào
        // camera-relative movement.
        //
        // ====================================================


        // ====================================================
        // JOYSTICK MAGNITUDEai
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

const WALK_SPEED = 4.2;
const RUN_SPEED = 6.9;
const CROUCH_SPEED = 2.1;

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
// MOVEMENT - CHECK SERVER COLLISION BOXES
// ====================================================

// ====================================================
// MOVEMENT - HOSPITAL COLLISION
// ====================================================

const currentX = player.position.x;
const currentZ = player.position.z;

const dx = velocityX.current * delta;
const dz = velocityZ.current * delta;

const targetX = currentX + dx;
const targetZ = currentZ + dz;

// Kiểm tra X riêng để nhân vật có thể trượt dọc tường.
if (
    Math.abs(dx) > 0.0001 &&
    canMoveAgainstHospital(
        targetX,
        currentZ,
        player.position.y,
        PLAYER_RADIUS,
    ) &&
    canMoveAroundBombs(targetX, currentZ)
) {
    player.position.x = targetX;
}

// Kiểm tra Z sau khi xử lý X.
if (
    Math.abs(dz) > 0.0001 &&
    canMoveAgainstHospital(
        player.position.x,
        targetZ,
        player.position.y,
        PLAYER_RADIUS,
    ) &&
    canMoveAroundBombs(player.position.x, targetZ)
) {
    player.position.z = targetZ;
}

   // ====================================================
// MOVEMENT ANIMATION
// ====================================================

// Nhân vật vẫn chạy animation khi người chơi giữ joystick,
// kể cả lúc bị góc tường chặn hoàn toàn.
const hasMovementInput = strength > 0.08;
// Joystick có y dương nghĩa là người chơi kéo về phía sau
// theo hệ tọa độ điều khiển hiện tại.
const nextMovingBackward =
    hasMovementInput &&
    y > DEAD_ZONE &&
    Math.abs(y) >= Math.abs(x);

if (nextMovingBackward !== movingBackwardRef.current) {
    movingBackwardRef.current = nextMovingBackward;
    setMovingBackward(nextMovingBackward);
}
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

if (
    hasMovementInput &&
    Date.now() > attackAimUntilRef.current
) {
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

    const rotationDifference =
    lastSentRotation.current === null
        ? Infinity
        : Math.abs(
            Math.atan2(
                Math.sin(
                    player.rotation.y -
                    lastSentRotation.current
                ),
                Math.cos(
                    player.rotation.y -
                    lastSentRotation.current
                ),
            ),
        );

const shouldSendMovement =
    actualSpeed > 0.001 ||
    lastSentMoving.current !== nextMoving ||
    rotationDifference > 0.02;

    if (shouldSendMovement) {
        room.send("move", {
            x: player.position.x,
            y: player.position.y,
            z: player.position.z,
            rotation: player.rotation.y,
            moving: nextMoving,
        });

        lastSentMoving.current = nextMoving;
        lastSentRotation.current = player.rotation.y;
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
                moving={isMoving}
                movingBackward={movingBackward}
                running={running && isMoving && !isCrouching}
                crouching={isCrouching}
aiming={
    aiming &&
    weaponType.trim().toLowerCase().replace(/[\s-]+/g, "_")
        .includes("rifle")
}
                jumpTrigger={jumpTrigger}
                weaponType={weaponType}
            />
        </group>
    </group>
);
}