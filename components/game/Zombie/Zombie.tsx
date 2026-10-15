
"use client";

import { useEffect, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { getStateCallbacks } from "@colyseus/sdk";
import { SkeletonUtils } from "three-stdlib";
import * as THREE from "three";

import { useMultiplayerStore } from "@/stores/multiplayer.store";

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

// Đường dẫn model zombie GLB
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

function ZombieModel({
    zombie,
}: {
    zombie: ZombieSnapshot;
}) {
    const { scene, animations } = useGLTF(ZOMBIE_MODEL_PATH);

    // Mỗi zombie cần một bản clone riêng để không dùng chung skeleton.
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

    // Phát animation có sẵn trong file GLB, nếu có.
    useEffect(() => {
        if (animations.length === 0) return;

        const clip =
            animations.find((item) =>
                /walk|run|move/i.test(item.name),
            ) ?? animations[0];

        const action = mixer.clipAction(clip);
        action.reset().play();

        return () => {
            action.stop();
            mixer.stopAllAction();
        };
    }, [animations, mixer]);

    useFrame((_, delta) => {
        mixer.update(delta);
    });

    const health = THREE.MathUtils.clamp(zombie.hp / 100, 0, 1);

    return (
        <group
            position={[zombie.x, zombie.y, zombie.z]}
            rotation={[0, zombie.rotation, 0]}
        >
            {/* Model zombie */}
          <primitive
    object={model}
    scale={1}
/>

            {/* Thanh máu */}
            <group position={[0, 2.2, 0]}>
                <mesh>
                    <planeGeometry args={[0.8, 0.09]} />
                    <meshBasicMaterial
                        color="#333333"
                        depthTest={false}
                    />
                </mesh>

                <mesh
                    position={[-0.4 * (1 - health), 0, 0.005]}
                >
                    <planeGeometry
                        args={[0.8 * health, 0.07]}
                    />
                    <meshBasicMaterial
                        color={zombie.attacking ? "#ff2222" : "#e53935"}
                        toneMapped={false}
                        depthTest={false}
                    />
                </mesh>
            </group>
        </group>
    );
}

export default function Zombie() {
    const room = useMultiplayerStore((s) => s.room);

    const [zombies, setZombies] = useState<ZombieSnapshot[]>([]);

useEffect(() => {
    if (!room) {
        setZombies([]);
        return;
    }

    const callbacks = getStateCallbacks(room);
    const collection = room.state.zombies;
    const unsubscribers: Array<() => void> = [];

    const syncZombies = () => {
        const next: ZombieSnapshot[] = [];

        collection.forEach((zombie: any) => {
            next.push(readZombie(zombie));
        });

        setZombies(next);
    };

    // Lắng nghe thay đổi tọa độ và trạng thái
    // của từng zombie, không chỉ của collection.
    const bindZombie = (zombie: any) => {
        const unsubscribe = callbacks(zombie).onChange(() => {
            syncZombies();
        });

        unsubscribers.push(unsubscribe);
    };

    collection.forEach((zombie: any) => {
        bindZombie(zombie);
    });

    const unsubscribeAdd = callbacks(collection).onAdd(
        (zombie: any) => {
            bindZombie(zombie);
            syncZombies();
        },
    );

    const unsubscribeRemove = callbacks(collection).onRemove(
        () => {
            syncZombies();
        },
    );

    syncZombies();

    return () => {
        unsubscribeAdd();
        unsubscribeRemove();

        unsubscribers.forEach((unsubscribe) => {
            unsubscribe();
        });
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
