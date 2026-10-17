
"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useCameraStore } from "@/stores/camera.store";
import { useCameraViewStore } from "@/stores/camera-view.store";
import {
    Vector3,
    Raycaster,
    Object3D,
} from "three";
import type { RefObject } from "react";
import type { Group } from "three";

type Props = {
    target: RefObject<Group | null>;
};

// ============================================================
// CAMERA SETTINGS
// ============================================================

const HEIGHT = 2.4;
const TARGET_HEIGHT = 3.8;
const SMOOTH_SPEED = 10;

const CAMERA_DISTANCE = 4;
const CAMERA_FOV = 65;

const FIRST_PERSON_HEIGHT = 1.65;
const FIRST_PERSON_LOOK_DISTANCE = 5;

const LOOKUP_START_PITCH = 0.35;
const LOOKUP_END_PITCH = 1.1;

const MIN_CAMERA_DISTANCE = 0.15;
const COLLISION_PADDING = 0.18;

const MIN_PITCH = -1.2;
const MAX_PITCH = 1.2;

// ============================================================
// CAMERA CONTROLLER
// ============================================================

export default function CameraController({ target }: Props) {
    const { camera, scene } = useThree();

    const raycaster = useRef(new Raycaster());

    const cameraTarget = useRef(new Vector3());
    const desiredPosition = useRef(new Vector3());
    const direction = useRef(new Vector3());
    const safePosition = useRef(new Vector3());
    const lookTarget = useRef(new Vector3());

    const collisionObjects = useRef<Object3D[]>([]);

    // ========================================================
    // CAMERA FOV
    // ========================================================

    useEffect(() => {
        if ("fov" in camera) {
            camera.fov = CAMERA_FOV;
            camera.updateProjectionMatrix();
        }
    }, [camera]);

    // ========================================================
    // CAMERA UPDATE
    // ========================================================

    useFrame((_, delta) => {
        const player = target.current;

        if (!player) return;

        const { yaw, pitch } = useCameraStore.getState();

        const safePitch = Math.max(
            MIN_PITCH,
            Math.min(MAX_PITCH, pitch)
        );

        // Tính mức chuyển đổi từ góc nhìn thứ ba sang thứ nhất.
        const lookupAmount = Math.max(
            0,
            Math.min(
                1,
                (-safePitch - LOOKUP_START_PITCH) /
                    (LOOKUP_END_PITCH - LOOKUP_START_PITCH)
            )
        );

        // Chuyển sang góc nhìn thứ nhất khi ngẩng đủ cao.
        const firstPerson = lookupAmount >= 0.95;

        useCameraViewStore
            .getState()
            .setFirstPerson(firstPerson);

        // Điểm camera hướng tới ở phía trên nhân vật.
        cameraTarget.current.set(
            player.position.x,
            player.position.y + TARGET_HEIGHT,
            player.position.z
        );

        // Khoảng cách camera giảm dần khi ngẩng đầu.
        const currentDistance =
            CAMERA_DISTANCE * (1 - lookupAmount);

        // ====================================================
        // FIRST-PERSON CAMERA
        // ====================================================

        if (firstPerson) {
            // Đặt camera tại vị trí mắt nhân vật.
            desiredPosition.current.set(
                player.position.x,
                player.position.y + FIRST_PERSON_HEIGHT,
                player.position.z
            );

            // Tính điểm nhìn theo yaw và pitch hiện tại.
            lookTarget.current.set(
                desiredPosition.current.x -
                    Math.sin(yaw) *
                    Math.cos(safePitch) *
                    FIRST_PERSON_LOOK_DISTANCE,

                desiredPosition.current.y +
                    Math.sin(-safePitch) *
                    FIRST_PERSON_LOOK_DISTANCE,

                desiredPosition.current.z +
                    Math.cos(yaw) *
                    Math.cos(safePitch) *
                    FIRST_PERSON_LOOK_DISTANCE
            );

            // Làm mượt vị trí camera.
            camera.position.lerp(
                desiredPosition.current,
                1 - Math.exp(-SMOOTH_SPEED * delta)
            );
        } else {
            // =================================================
            // THIRD-PERSON CAMERA
            // =================================================

            const horizontalDistance =
                currentDistance * Math.cos(safePitch);

            desiredPosition.current.set(
                player.position.x -
                    Math.sin(yaw) * horizontalDistance,

                player.position.y +
                    HEIGHT +
                    Math.sin(safePitch) * currentDistance,

                player.position.z +
                    Math.cos(yaw) * horizontalDistance
            );

            // Hướng từ điểm ngắm đến vị trí camera mong muốn.
            direction.current
                .subVectors(
                    desiredPosition.current,
                    cameraTarget.current
                )
                .normalize();

            const desiredDistance =
                cameraTarget.current.distanceTo(
                    desiredPosition.current
                );

            // ================================================
            // CAMERA COLLISION
            // ================================================

            const objects = collisionObjects.current;
            objects.length = 0;

            scene.traverse((object) => {
                if (
                    object.userData.cameraCollision === true &&
                    object.visible
                ) {
                    objects.push(object);
                }
            });

            const ray = raycaster.current;

            ray.set(
                cameraTarget.current,
                direction.current
            );

            ray.near = 0;
            ray.far = desiredDistance;

            const hits = ray.intersectObjects(objects, true);

            let safeDistance = desiredDistance;

            const hit = hits.find(
                (item) =>
                    item.distance > MIN_CAMERA_DISTANCE
            );

            if (hit) {
                safeDistance = Math.max(
                    MIN_CAMERA_DISTANCE,
                    hit.distance - COLLISION_PADDING
                );
            }

            // Tính vị trí camera an toàn để tránh xuyên tường.
            safePosition.current
                .copy(cameraTarget.current)
                .addScaledVector(
                    direction.current,
                    safeDistance
                );

            // Làm mượt camera, phản ứng nhanh hơn khi gặp vật cản.
            const smooth =
                1 - Math.exp(-SMOOTH_SPEED * delta);

            camera.position.lerp(
                safePosition.current,
                Math.min(
                    1,
                    smooth *
                        (safeDistance < desiredDistance ? 3 : 1)
                )
            );

            lookTarget.current.copy(cameraTarget.current);
        }

        // ====================================================
        // CAMERA LOOK AT
        // ====================================================

        camera.up.set(0, 1, 0);

        camera.lookAt(
            lookTarget.current.x,
            lookTarget.current.y,
            lookTarget.current.z
        );
    });

    return null;
}
