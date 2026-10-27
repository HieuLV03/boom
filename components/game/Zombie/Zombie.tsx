
"use client";

import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { getStateCallbacks } from "@colyseus/sdk";
import { SkeletonUtils } from "three-stdlib";
import * as THREE from "three";

import { useMultiplayerStore } from "@/stores/multiplayer.store";

// ============================================================
// TYPES
// ============================================================

interface ZombieSnapshot {
    id: string;
    x: number;
    y: number;
    z: number;
    rotation: number;
    hp: number;
    alive: boolean;
    moving: boolean;
    attacking: boolean;
}

const ZOMBIE_MODEL_PATH = "/assets/zombie/zombie.glb";

function readZombie(zombie: any): ZombieSnapshot {
    return {
        id: zombie.id,
        x: zombie.x,
        y: zombie.y,
        z: zombie.z,
        rotation: zombie.rotation,
        hp: zombie.hp,
        alive: zombie.alive,
        moving: zombie.moving,
        attacking: zombie.attacking,
    };
}

// ============================================================
// ZOMBIE MODEL
// ============================================================

function ZombieModel({
    zombie,
}: {
    zombie: ZombieSnapshot;
}) {
    const { scene, animations } = useGLTF(ZOMBIE_MODEL_PATH);

    // Clone model để mỗi zombie có skeleton riêng.
    const model = useMemo(() => {
        const cloned = SkeletonUtils.clone(scene);

        cloned.traverse((object) => {
            if (object instanceof THREE.Mesh) {
                object.castShadow = true;
                object.receiveShadow = true;
            }
        });

        return cloned;
    }, [scene]);

    const mixer = useMemo(
        () => new THREE.AnimationMixer(model),
        [model],
    );

    const idleActionRef =
        useRef<THREE.AnimationAction | null>(null);

    const walkActionRef =
        useRef<THREE.AnimationAction | null>(null);

    const punchActionRef =
        useRef<THREE.AnimationAction | null>(null);

    const currentBaseActionRef =
        useRef<THREE.AnimationAction | null>(null);

    const movingRef = useRef(zombie.moving);
    const attackingRef = useRef(zombie.attacking);

    // Luôn giữ trạng thái mới nhất từ Colyseus.
    useEffect(() => {
        movingRef.current = zombie.moving;
        attackingRef.current = zombie.attacking;
    }, [zombie.moving, zombie.attacking]);

    // --------------------------------------------------------
    // FIND ANIMATIONS
    // --------------------------------------------------------

    useEffect(() => {
        mixer.stopAllAction();

        idleActionRef.current = null;
        walkActionRef.current = null;
        punchActionRef.current = null;
        currentBaseActionRef.current = null;

        if (animations.length === 0) {
            console.warn(
                "[ZOMBIE] Model không có animation",
            );
            return;
        }

        console.log(
            "[ZOMBIE] Available animations:",
            animations.map((clip) => clip.name),
        );

        const idleClip = animations.find((clip) =>
            /idle|stand|standing|breath/i.test(clip.name),
        );

        const walkClip = animations.find((clip) =>
            /walk|run|move/i.test(clip.name),
        );

        // Tìm đúng clip zombie_punch.
        const punchClip = animations.find((clip) =>
            /zombie[\s_-]*punch/i.test(clip.name),
        );

        idleActionRef.current = idleClip
            ? mixer.clipAction(idleClip)
            : null;

        walkActionRef.current = walkClip
            ? mixer.clipAction(walkClip)
            : null;

        punchActionRef.current = punchClip
            ? mixer.clipAction(punchClip)
            : null;

        if (!punchClip) {
            console.warn(
                '[ZOMBIE] Không tìm thấy animation "zombie_punch".',
                "Kiểm tra tên clip trong file zombie.glb.",
            );
        }

        // Chọn animation nền khi khởi tạo.
        const initialAction =
            (movingRef.current
                ? walkActionRef.current
                : idleActionRef.current) ??
            idleActionRef.current ??
            walkActionRef.current ??
            mixer.clipAction(animations[0]);

        currentBaseActionRef.current = initialAction;

        initialAction.reset();
        initialAction.setLoop(THREE.LoopRepeat, Infinity);
        initialAction.play();

        // Khi animation đấm kết thúc, quay lại idle/walk.
        const handleFinished = (
            event: { action: THREE.AnimationAction },
        ) => {
            if (event.action !== punchActionRef.current) {
                return;
            }

            event.action.fadeOut(0.12);

            const nextBaseAction =
                (movingRef.current
                    ? walkActionRef.current
                    : idleActionRef.current) ??
                idleActionRef.current ??
                walkActionRef.current;

            if (nextBaseAction) {
                currentBaseActionRef.current = nextBaseAction;

                nextBaseAction
                    .reset()
                    .setLoop(THREE.LoopRepeat, Infinity)
                    .fadeIn(0.12)
                    .play();
            }
        };

        mixer.addEventListener("finished", handleFinished);

        // Nếu component được tạo lúc zombie đang tấn công.
        if (attackingRef.current && punchClip) {
            initialAction.fadeOut(0.1);

            const punchAction = punchActionRef.current!;

            punchAction
                .reset()
                .setLoop(THREE.LoopOnce, 1);

            punchAction.clampWhenFinished = true;
            punchAction.fadeIn(0.1).play();
        }

        return () => {
            mixer.removeEventListener(
                "finished",
                handleFinished,
            );

            mixer.stopAllAction();

            idleActionRef.current = null;
            walkActionRef.current = null;
            punchActionRef.current = null;
            currentBaseActionRef.current = null;
        };
    }, [animations, mixer]);

    // --------------------------------------------------------
    // ATTACK ANIMATION
    // --------------------------------------------------------

    useEffect(() => {
        if (!zombie.attacking) {
            return;
        }

        const punchAction = punchActionRef.current;

        // Không có clip đấm thì giữ animation nền.
        if (!punchAction) {
            return;
        }

        const currentBase = currentBaseActionRef.current;

        // Không khởi động lại nếu punch đang chạy.
        if (punchAction.isRunning()) {
            return;
        }

        currentBase?.fadeOut(0.1);

        punchAction.reset();
        punchAction.setLoop(THREE.LoopOnce, 1);
        punchAction.clampWhenFinished = true;
        punchAction.fadeIn(0.1).play();
    }, [zombie.attacking]);

    // --------------------------------------------------------
    // IDLE / WALK ANIMATION
    // --------------------------------------------------------

    useEffect(() => {
        // Nếu punch đang chạy, không để animation di chuyển
        // ghi đè animation tấn công.
        if (punchActionRef.current?.isRunning()) {
            return;
        }

        const nextAction =
            (zombie.moving
                ? walkActionRef.current
                : idleActionRef.current) ??
            idleActionRef.current ??
            walkActionRef.current;

        if (!nextAction) {
            return;
        }

        const currentAction = currentBaseActionRef.current;

        if (currentAction === nextAction) {
            return;
        }

        currentAction?.fadeOut(0.12);

        currentBaseActionRef.current = nextAction;

        nextAction
            .reset()
            .setLoop(THREE.LoopRepeat, Infinity)
            .fadeIn(0.12)
            .play();
    }, [zombie.moving]);

    // Cập nhật animation mixer mỗi frame.
    useFrame((_, delta) => {
        mixer.update(delta);
    });

    // --------------------------------------------------------
    // HEALTH BAR
    // --------------------------------------------------------

    const health = THREE.MathUtils.clamp(
        zombie.hp / 100,
        0,
        1,
    );

    return (
        <group
            position={[
                zombie.x,
                zombie.y,
                zombie.z,
            ]}
            rotation={[0, zombie.rotation, 0]}
        >
            <primitive object={model} scale={1} />

            <group position={[0, 2.2, 0]}>
                <mesh>
                    <planeGeometry args={[0.8, 0.09]} />

                    <meshBasicMaterial
                        color="#333333"
                        depthTest={false}
                    />
                </mesh>

                <mesh
                    position={[
                        -0.4 * (1 - health),
                        0,
                        0.005,
                    ]}
                >
                    <planeGeometry
                        args={[
                            0.8 * health,
                            0.07,
                        ]}
                    />

                    <meshBasicMaterial
                        color={
                            zombie.attacking
                                ? "#ff2222"
                                : "#e53935"
                        }
                        toneMapped={false}
                        depthTest={false}
                    />
                </mesh>
            </group>
        </group>
    );
}
// ============================================================
// ZOMBIE STATE SYNC
// ============================================================

export default function Zombie() {
    const room = useMultiplayerStore((s) => s.room);

    const [zombies, setZombies] =
        useState<ZombieSnapshot[]>([]);

    useEffect(() => {
        if (!room) {
            setZombies([]);
            return;
        }

        let disposed = false;
        let collectionBound = false;

        const unsubscribers: Array<() => void> = [];

        const zombieUnsubscribers = new Map<
            string,
            () => void
        >();

        const callbacks = getStateCallbacks(room);

        const syncZombies = () => {
            if (disposed) return;

            const collection = (room.state as any)?.zombies;

            if (
                !collection ||
                typeof collection.forEach !== "function"
            ) {
                setZombies([]);
                return;
            }

            const next: ZombieSnapshot[] = [];

            collection.forEach(
                (zombie: any, key: string) => {
                    if (!zombie) return;

                    next.push({
                        ...readZombie(zombie),
                        id: String(zombie.id || key),
                    });
                },
            );

            setZombies(next);
        };

        const bindZombie = (
            zombie: any,
            key: string,
        ) => {
            if (!zombie) return;

            const id = String(zombie.id || key);

            if (zombieUnsubscribers.has(id)) {
                return;
            }

            const unsubscribe = callbacks(zombie).onChange(
                () => {
                    syncZombies();
                },
            );

            zombieUnsubscribers.set(id, unsubscribe);
        };

        const bindCollection = () => {
            if (disposed || collectionBound) return;

            const collection = (room.state as any)?.zombies;

            if (
                !collection ||
                typeof collection.forEach !== "function"
            ) {
                return;
            }

            collectionBound = true;

            collection.forEach(
                (zombie: any, key: string) => {
                    bindZombie(zombie, String(key));
                },
            );

            const unsubscribeAdd = callbacks(
                collection,
            ).onAdd(
                (zombie: any, key: string) => {
                    bindZombie(zombie, String(key));
                    syncZombies();
                },
            );

            const unsubscribeRemove = callbacks(
                collection,
            ).onRemove(
                (zombie: any, key: string) => {
                    const id = String(zombie?.id || key);

                    zombieUnsubscribers.get(id)?.();
                    zombieUnsubscribers.delete(id);

                    syncZombies();
                },
            );

            unsubscribers.push(
                unsubscribeAdd,
                unsubscribeRemove,
            );

            syncZombies();

            console.log(
                "[ZOMBIE] Đã kết nối collection:",
                {
                    roomId: room.roomId,
                    count: (room.state as any).zombies.size,
                },
            );
        };

        // Thử kết nối ngay khi effect chạy.
        bindCollection();

        // Thử lại khi state được đồng bộ.
        room.onStateChange(() => {
            if (disposed) return;

            bindCollection();
            syncZombies();
        });

        return () => {
            disposed = true;

            unsubscribers.forEach((unsubscribe) => {
                unsubscribe();
            });

            zombieUnsubscribers.forEach((unsubscribe) => {
                unsubscribe();
            });

            unsubscribers.length = 0;
            zombieUnsubscribers.clear();
        };
    }, [room]);

    return (
        <group>
            {zombies
                .filter((zombie) => zombie.alive)
                .map((zombie) => (
                    <ZombieModel
                        key={zombie.id}
                        zombie={zombie}
                    />
                ))}
        </group>
    );
}

useGLTF.preload(ZOMBIE_MODEL_PATH);
