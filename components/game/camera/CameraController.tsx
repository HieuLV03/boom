
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

type Props = {
    target: RefObject<Group | null>;
};

const DISTANCE = 4;
const HEIGHT = 2.4;
const TARGET_HEIGHT = 3.9;
const SMOOTH_SPEED = 10;

const MIN_CAMERA_DISTANCE = 0.65;
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

        const horizontalDistance =
            DISTANCE * Math.cos(safePitch);

        // Điểm camera nhìn vào trên nhân vật.
        cameraTarget.current.set(
            player.position.x,
            player.position.y + TARGET_HEIGHT,
            player.position.z
        );

        // Vị trí camera mong muốn trước khi xử lý va chạm.
        desiredPosition.current.set(
            player.position.x -
                Math.sin(yaw) * horizontalDistance,
            player.position.y +
                HEIGHT +
                Math.sin(safePitch) * DISTANCE,
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

        // Lấy các vật cản đã được đánh dấu từ map.
        // Dùng lại mảng để giảm cấp phát bộ nhớ mỗi frame.
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

        // Bỏ qua giao điểm quá gần điểm xuất phát,
        // tránh camera bị đẩy sát vào nhân vật.
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

        // Thu camera nhanh khi bị vật cản.
        // Khi hết vật cản, camera trở về vị trí mong muốn từ từ.
        if (safeDistance < desiredDistance) {
            camera.position.lerp(
                safePosition.current,
                Math.min(1, smooth * 3)
            );
        } else {
            camera.position.lerp(
                safePosition.current,
                smooth
            );
        }

        camera.up.set(0, 1, 0);
        camera.lookAt(
            cameraTarget.current.x,
            cameraTarget.current.y,
            cameraTarget.current.z
        );

        // Xoay màn hình 90 độ khi chơi ở chế độ dọc.
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
