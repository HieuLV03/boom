
"use client";

import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    useFrame,
} from "@react-three/fiber";

import {
    Group,
    Vector3,
} from "three";

import {
    useMultiplayerStore,
} from "@/stores/multiplayer.store";

// ============================================================
// TYPES
// ============================================================

type BulletData = {
    id: number;
    origin: {
        x: number;
        y: number;
        z: number;
    };
    direction: {
        x: number;
        y: number;
        z: number;
    };
};

type BulletProjectileProps = {
    bullet: BulletData;
    onFinish: (id: number) => void;
};

// ============================================================
// CONFIG
// ============================================================

const BULLET_SPEED = 90;
const BULLET_RANGE = 22;

// ============================================================
// SINGLE PROJECTILE
// ============================================================

function BulletProjectile({
    bullet,
    onFinish,
}: BulletProjectileProps) {
    const groupRef = useRef<Group>(null);

    const distanceRef = useRef(0);
    const finishedRef = useRef(false);

    const origin = useRef(
        new Vector3(
            bullet.origin.x,
            bullet.origin.y,
            bullet.origin.z,
        ),
    ).current;

    const direction = useRef(
        new Vector3(
            bullet.direction.x,
            bullet.direction.y,
            bullet.direction.z,
        ).normalize(),
    ).current;

    useEffect(() => {
        const group = groupRef.current;

        if (!group) return;

        // Cylinder mặc định nằm theo trục Y.
        // Xoay trục Y theo hướng viên đạn bay.
        group.quaternion.setFromUnitVectors(
            new Vector3(0, 1, 0),
            direction,
        );

        group.position.copy(origin);
    }, [origin, direction]);

    useFrame((_, delta) => {
        const group = groupRef.current;

        if (!group || finishedRef.current) {
            return;
        }

        distanceRef.current += BULLET_SPEED * delta;

        group.position
            .copy(origin)
            .addScaledVector(
                direction,
                distanceRef.current,
            );

        if (distanceRef.current >= BULLET_RANGE) {
            finishedRef.current = true;
            onFinish(bullet.id);
        }
    });

    return (
        <group ref={groupRef}>
            {/* Đầu đạn */}
            <mesh>
                <sphereGeometry args={[0.065, 8, 8]} />
                <meshBasicMaterial color="#fff4b0" />
            </mesh>

            {/* Vệt sáng phía sau đầu đạn */}
            <mesh position={[0, -0.22, 0]}>
                <cylinderGeometry
                    args={[0.018, 0.035, 0.44, 6]}
                />
                <meshBasicMaterial
                    color="#ffb52e"
                    transparent
                    opacity={0.9}
                />
            </mesh>
        </group>
    );
}

// ============================================================
// BULLET EFFECTS
// Phải được render bên trong R3F Canvas.
// ============================================================

export default function BulletEffects() {
    const room = useMultiplayerStore(
        (state) => state.room,
    );

    const [bullets, setBullets] = useState<BulletData[]>([]);
    const nextId = useRef(0);

    useEffect(() => {
        if (!room) {
            setBullets([]);
            return;
        }

        const unsubscribe = room.onMessage(
            "attackPerformed",
            (message: any) => {
                if (message?.action !== "shoot") {
                    return;
                }

                const origin = message.origin;
                const direction = message.direction;

                if (!origin || !direction) {
                    return;
                }

                const values = [
                    origin.x,
                    origin.y,
                    origin.z,
                    direction.x,
                    direction.y,
                    direction.z,
                ].map(Number);

                if (!values.every(Number.isFinite)) {
                    return;
                }

                const [ox, oy, oz, dx, dy, dz] = values;

                const length = Math.hypot(dx, dy, dz);

                if (length < 0.0001) {
                    return;
                }

                const bullet: BulletData = {
                    id: ++nextId.current,

                    origin: {
                        x: ox,
                        y: oy,
                        z: oz,
                    },

                    direction: {
                        x: dx / length,
                        y: dy / length,
                        z: dz / length,
                    },
                };

                setBullets((current) => [
                    ...current,
                    bullet,
                ]);
            },
        );

        return () => {
            unsubscribe();
            setBullets([]);
        };
    }, [room]);

    const removeBullet = (id: number) => {
        setBullets((current) =>
            current.filter((bullet) => bullet.id !== id),
        );
    };

    return (
        <group>
            {bullets.map((bullet) => (
                <BulletProjectile
                    key={bullet.id}
                    bullet={bullet}
                    onFinish={removeBullet}
                />
            ))}
        </group>
    );
}
