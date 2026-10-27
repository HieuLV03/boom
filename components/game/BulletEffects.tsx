
"use client";

import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import {
    useFrame,
    useThree,
} from "@react-three/fiber";

import {
    Group,
    Raycaster,
    Vector3,
    type Object3D,
} from "three";

import {
    useMultiplayerStore,
} from "@/stores/multiplayer.store";

type Vec3 = {
    x: number;
    y: number;
    z: number;
};

type BulletData = {
    id: number;
    origin: Vec3;
    direction: Vec3;
    range: number;
};

type BulletProjectileProps = {
    bullet: BulletData;
    hospital: Object3D | null;
    onFinish: (id: number) => void;
};

const BULLET_SPEED = 90;
const MAX_RANGE = 51;
const WALL_EPSILON = 0.025;

function BulletProjectile({
    bullet,
    hospital,
    onFinish,
}: BulletProjectileProps) {
    const groupRef = useRef<Group>(null);
    const distanceRef = useRef(0);
    const finishedRef = useRef(false);

    const raycasterRef = useRef(new Raycaster());
    const previousPositionRef = useRef(
        new Vector3(
            bullet.origin.x,
            bullet.origin.y,
            bullet.origin.z,
        ),
    );

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

        group.quaternion.setFromUnitVectors(
            new Vector3(0, 1, 0),
            direction,
        );

        group.position.copy(origin);
        previousPositionRef.current.copy(origin);
    }, [origin, direction]);

    useFrame((_, delta) => {
        const group = groupRef.current;

        if (!group || finishedRef.current) return;

        const previous = previousPositionRef.current;

        const nextDistance = Math.min(
            bullet.range,
            distanceRef.current +
                BULLET_SPEED * Math.min(delta, 0.05),
        );

        const nextPosition = origin
            .clone()
            .addScaledVector(direction, nextDistance);

        // Kiểm tra đoạn đường bay từ vị trí cũ đến vị trí mới.
        const segment = nextPosition.clone().sub(previous);
        const segmentLength = segment.length();

        if (hospital && segmentLength > 0.00001) {
            hospital.updateMatrixWorld(true);

            const raycaster = raycasterRef.current;

            raycaster.set(
                previous,
                segment.multiplyScalar(1 / segmentLength),
            );

            raycaster.near = 0;
            raycaster.far = segmentLength;

            const hits = raycaster.intersectObject(
                hospital,
                true,
            );

            // Chỉ xử lý va chạm với mesh của bệnh viện.
            const wallHit = hits.find(
                (hit) =>
                    hit.object.userData.bulletPassThrough !== true,
            );

            if (wallHit) {
                group.position
                    .copy(wallHit.point)
                    .addScaledVector(
                        direction,
                        -WALL_EPSILON,
                    );

                finishedRef.current = true;
                onFinish(bullet.id);
                return;
            }
        }

        distanceRef.current = nextDistance;
        group.position.copy(nextPosition);
        previousPositionRef.current.copy(nextPosition);

        if (distanceRef.current >= bullet.range) {
            finishedRef.current = true;
            onFinish(bullet.id);
        }
    });

    return (
        <group ref={groupRef}>
            <mesh>
                <sphereGeometry args={[0.065, 8, 8]} />
                <meshBasicMaterial color="#fff4b0" />
            </mesh>

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

export default function BulletEffects() {
    const room = useMultiplayerStore(
        (state) => state.room,
    );

    const { scene } = useThree();

    const [bullets, setBullets] = useState<BulletData[]>([]);
    const nextId = useRef(0);
    const hospitalRef = useRef<Object3D | null>(null);

    const findHospital = useCallback(() => {
        let found: Object3D | null = null;

        scene.traverse((object) => {
            if (object.userData.isHospitalModel === true) {
                found = object;
            }
        });

        hospitalRef.current = found;
    }, [scene]);

    useEffect(() => {
        findHospital();

        return () => {
            hospitalRef.current = null;
        };
    }, [findHospital]);

    useEffect(() => {
        if (!room) {
            setBullets([]);
            return;
        }

        const unsubscribe = room.onMessage(
            "attackPerformed",
            (message: any) => {
                if (message?.action !== "shoot") return;

                const origin = message.origin;
                const direction = message.direction;

                if (!origin || !direction) return;

                const values = [
                    origin.x,
                    origin.y,
                    origin.z,
                    direction.x,
                    direction.y,
                    direction.z,
                ].map(Number);

                if (!values.every(Number.isFinite)) return;

                const [ox, oy, oz, dx, dy, dz] = values;
                const directionLength = Math.hypot(dx, dy, dz);

                if (directionLength < 0.0001) return;

                let range = Number(message.distance);

                if (!Number.isFinite(range) || range <= 0) {
                    range = Number(message.range);
                }

                if (!Number.isFinite(range) || range <= 0) {
                    range = MAX_RANGE;
                }

                range = Math.max(
                    0.01,
                    Math.min(range, MAX_RANGE),
                );

                const bullet: BulletData = {
                    id: ++nextId.current,
                    origin: {
                        x: ox,
                        y: oy,
                        z: oz,
                    },
                    direction: {
                        x: dx / directionLength,
                        y: dy / directionLength,
                        z: dz / directionLength,
                    },
                    range,
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

    const removeBullet = useCallback((id: number) => {
        setBullets((current) =>
            current.filter((bullet) => bullet.id !== id),
        );
    }, []);

    return (
        <group>
            {bullets.map((bullet) => (
                <BulletProjectile
                    key={bullet.id}
                    bullet={bullet}
                    hospital={hospitalRef.current}
                    onFinish={removeBullet}
                />
            ))}
        </group>
    );
}
