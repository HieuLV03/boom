
"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useCameraStore } from "@/stores/camera.store";
import {
    Quaternion,
    Vector3,
    Raycaster,
    Object3D,
} from "three";
import type { RefObject } from "react";
import type { Group } from "three";
import { useCameraViewStore } from "@/stores/camera-view.store";
type Props = {
    target: RefObject<Group | null>;
};

// ============================================================
// CAMERA SETTINGS
// ============================================================

const DISTANCE = 4;
const HEIGHT = 2.4;
const TARGET_HEIGHT = 3.9;
const SMOOTH_SPEED = 10;

const FIRST_PERSON_HEIGHT = 1.65;
const FIRST_PERSON_LOOK_DISTANCE = 5;

const LOOKUP_START_PITCH = 0.35;
const LOOKUP_END_PITCH = 1.1;

const MIN_CAMERA_DISTANCE = 0.15;
const COLLISION_PADDING = 0.18;

const MIN_PITCH = -1.2;
const MAX_PITCH = 1.2;

const LANDSCAPE_FOV = 65;
const PORTRAIT_FOV = 85;

export default function CameraController({ target }: Props) {
    const { camera, scene } = useThree();
    const [isPortrait, setIsPortrait] = useState(false);

    const raycaster = useRef(new Raycaster());
    const cameraTarget = useRef(new Vector3());
    const desiredPosition = useRef(new Vector3());
    const direction = useRef(new Vector3());
    const safePosition = useRef(new Vector3());
    const lookTarget = useRef(new Vector3());

    const collisionObjects = useRef<Object3D[]>([]);

    const baseQuaternion = useRef(new Quaternion());
    const rollQuaternion = useRef(new Quaternion());
    const rollAxis = useRef(new Vector3(0, 0, 1));

    useEffect(() => {
        const updateCamera = () => {
            const portrait =
                window.innerHeight > window.innerWidth;

            setIsPortrait(portrait);

            if ("fov" in camera) {
                camera.fov = portrait
                    ? PORTRAIT_FOV
                    : LANDSCAPE_FOV;

                camera.updateProjectionMatrix();
            }
        };

        updateCamera();

        window.addEventListener("resize", updateCamera);
        window.addEventListener("orientationchange", updateCamera);

        return () => {
            window.removeEventListener("resize", updateCamera);
            window.removeEventListener(
                "orientationchange",
                updateCamera
            );
        };
    }, [camera]);

    useFrame((_, delta) => {
        const player = target.current;
        if (!player) return;

        const { yaw, pitch } = useCameraStore.getState();

        const safePitch = Math.max(
            MIN_PITCH,
            Math.min(MAX_PITCH, pitch)
        );

        // Pitch âm được giả định là nhìn lên.
        const lookupAmount = Math.max(
            0,
            Math.min(
                1,
                (-safePitch - LOOKUP_START_PITCH) /
                    (LOOKUP_END_PITCH - LOOKUP_START_PITCH)
            )
        );

        // Chuyển sang góc nhìn thứ nhất gần góc ngẩng tối đa.
        const firstPerson = lookupAmount >= 0.95;
useCameraViewStore.getState().setFirstPerson(firstPerson);
        const currentDistance =
            DISTANCE * (1 - lookupAmount);

        cameraTarget.current.set(
            player.position.x,
            player.position.y + TARGET_HEIGHT,
            player.position.z
        );

        if (firstPerson) {
            // Camera đặt tại vị trí mắt.
            desiredPosition.current.set(
                player.position.x,
                player.position.y + FIRST_PERSON_HEIGHT,
                player.position.z
            );

            // Nhìn theo hướng yaw và góc ngẩng hiện tại.
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

            // Không áp dụng va chạm góc nhìn thứ ba
            // khi camera đã ở vị trí mắt.
            camera.position.lerp(
                desiredPosition.current,
                1 - Math.exp(-SMOOTH_SPEED * delta)
            );
        } else {
            // Góc nhìn thứ ba.
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
            ray.set(cameraTarget.current, direction.current);
            ray.near = 0;
            ray.far = desiredDistance;

            const hits = ray.intersectObjects(objects, true);

            let safeDistance = desiredDistance;

            const hit = hits.find(
                (item) => item.distance > MIN_CAMERA_DISTANCE
            );

            if (hit) {
                safeDistance = Math.max(
                    MIN_CAMERA_DISTANCE,
                    hit.distance - COLLISION_PADDING
                );
            }

            safePosition.current
                .copy(cameraTarget.current)
                .addScaledVector(direction.current, safeDistance);

            const smooth =
                1 - Math.exp(-SMOOTH_SPEED * delta);

            camera.position.lerp(
                safePosition.current,
                Math.min(
                    1,
                    smooth * (safeDistance < desiredDistance ? 3 : 1)
                )
            );

            lookTarget.current.copy(cameraTarget.current);
        }

        // Luôn nhìn về lookTarget.
        camera.up.set(0, 1, 0);
        camera.lookAt(
            lookTarget.current.x,
            lookTarget.current.y,
            lookTarget.current.z
        );

        // Xoay màn hình khi chơi dọc.
        if (isPortrait) {
            baseQuaternion.current.copy(camera.quaternion);

            rollAxis.current
                .set(0, 0, 1)
                .applyQuaternion(baseQuaternion.current)
                .normalize();

            rollQuaternion.current.setFromAxisAngle(
                rollAxis.current,
                Math.PI / 2
            );

            camera.quaternion
                .copy(rollQuaternion.current)
                .multiply(baseQuaternion.current);
        }
    });

    return null;
}
