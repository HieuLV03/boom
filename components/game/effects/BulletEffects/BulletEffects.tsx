
"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";

import "./BulletEffects.css";

// ============================================================
// TYPES
// ============================================================

interface Vec3 {
    x: number;
    y: number;
    z: number;
}

interface BulletShotEvent {
    origin: Vec3;
    direction: Vec3;
    range?: number;
    weapon?: string;
}

interface BulletShot {
    id: number;
    origin: THREE.Vector3;
    end: THREE.Vector3;
    direction: THREE.Vector3;
    distance: number;
    progress: number;
    duration: number;
    weapon: string;
}

interface BulletEffectsProps {
    defaultRange?: number;
    bulletSpeed?: number;
}

const DEFAULT_RANGE = 51;
const DEFAULT_BULLET_SPEED = 100;
const MUZZLE_FLASH_DURATION = 0.065;

// ============================================================
// COMPONENT
// ============================================================

export default function BulletEffects({
    defaultRange = DEFAULT_RANGE,
    bulletSpeed = DEFAULT_BULLET_SPEED,
}: BulletEffectsProps) {
    const [shots, setShots] = useState<BulletShot[]>([]);
    const [flash, setFlash] = useState(false);

    const nextId = useRef(0);
    const flashTimeout = useRef<ReturnType<
        typeof setTimeout
    > | null>(null);

    // Nhận sự kiện bắn từ GameHUD hoặc sự kiện combat phía client.
    useEffect(() => {
        const handleBulletFired = (event: Event) => {
            const customEvent =
                event as CustomEvent<BulletShotEvent>;

            const data = customEvent.detail;

            if (!data?.origin || !data?.direction) {
                return;
            }

            const origin = new THREE.Vector3(
                data.origin.x,
                data.origin.y,
                data.origin.z,
            );

            const direction = new THREE.Vector3(
                data.direction.x,
                data.direction.y,
                data.direction.z,
            );

            if (
                !Number.isFinite(origin.x) ||
                !Number.isFinite(origin.y) ||
                !Number.isFinite(origin.z) ||
                !Number.isFinite(direction.x) ||
                !Number.isFinite(direction.y) ||
                !Number.isFinite(direction.z) ||
                direction.lengthSq() < 0.000001
            ) {
                return;
            }

            direction.normalize();

            const range =
                Number.isFinite(data.range) &&
                (data.range ?? 0) > 0
                    ? data.range!
                    : defaultRange;

            const end = origin
                .clone()
                .addScaledVector(direction, range);

            const distance = origin.distanceTo(end);

            const shot: BulletShot = {
                id: ++nextId.current,
                origin,
                end,
                direction,
                distance,
                progress: 0,
                duration: Math.max(
                    distance / bulletSpeed,
                    0.025,
                ),
                weapon: data.weapon ?? "rifle",
            };

            setShots((previous) => [
                ...previous.slice(-29),
                shot,
            ]);

            setFlash(true);

            if (flashTimeout.current) {
                clearTimeout(flashTimeout.current);
            }

            flashTimeout.current = setTimeout(() => {
                setFlash(false);
            }, MUZZLE_FLASH_DURATION * 1000);
        };

        window.addEventListener(
            "boom:bullet-fired",
            handleBulletFired,
        );

        return () => {
            window.removeEventListener(
                "boom:bullet-fired",
                handleBulletFired,
            );

            if (flashTimeout.current) {
                clearTimeout(flashTimeout.current);
            }
        };
    }, [defaultRange, bulletSpeed]);

    // Tiến hành di chuyển đầu đạn theo thời gian.
    useFrame((_, delta) => {
        setShots((previous) => {
            let changed = false;

            const updated = previous
                .map((shot) => {
                    const progress = Math.min(
                        1,
                        shot.progress +
                            delta / shot.duration,
                    );

                    if (progress !== shot.progress) {
                        changed = true;
                    }

                    return {
                        ...shot,
                        progress,
                    };
                })
                .filter((shot) => shot.progress < 1);

            if (
                updated.length !== previous.length
            ) {
                changed = true;
            }

            return changed ? updated : previous;
        });
    });

    return (
        <>
            {shots.map((shot) => {
                const currentPosition = shot.origin
                    .clone()
                    .lerp(shot.end, shot.progress);

                return (
                    <group key={shot.id}>
                        {/* Vệt đạn */}
                        <Line
                            points={[
                                shot.origin,
                                currentPosition,
                            ]}
                            color={
                                shot.weapon === "rifle"
                                    ? "#ffe8a3"
                                    : "#ffffff"
                            }
                            lineWidth={1.5}
                            transparent
                            opacity={
                                1 - shot.progress * 0.65
                            }
                        />

                        {/* Đầu đạn */}
                        <mesh
                            position={currentPosition}
                            frustumCulled={false}
                        >
                            <sphereGeometry
                                args={[0.035, 6, 6]}
                            />
                            <meshBasicMaterial
                                color="#fff4c2"
                            />
                        </mesh>
                    </group>
                );
            })}

            {/* Chớp sáng nhỏ ở gốc tọa độ đạn */}
            {flash && shots.length > 0 && (
                <mesh
                    position={
                        shots[shots.length - 1].origin
                    }
                >
                    <sphereGeometry args={[0.075, 8, 8]} />
                    <meshBasicMaterial
                        color="#ffb347"
                        transparent
                        opacity={0.9}
                    />
                </mesh>
            )}
        </>
    );
}
