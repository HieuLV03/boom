
"use client";

import { useRef } from "react";
import type { Group } from "three";

import WeaponController from "./weapons/WeaponController";
import ScareObject from "./ScareObject";
import BulletEffects from "./BulletEffects";
import MapRenderer from "./maps/MapRenderer";
import Zombie from "./Zombie/Zombie";

import CameraController from "./camera/CameraController";
import LocalPlayerController from "./player/LocalPlayerController";
import RemotePlayers from "./multiplayer/RemotePlayers";
import BombController from "./bomb/BombController";

interface GameWorldProps {
    mapId?: string;
}

export default function GameWorld({
    mapId = "hospital",
}: GameWorldProps) {
    const playerRef = useRef<Group>(null);

    return (
        <group>
            {/* Hiển thị model GLB bệnh viện */}
            <MapRenderer mapId="hospital" />

            <ScareObject />

            <WeaponController playerRef={playerRef} />

            {/* Tạm thời chỉ hiện zombie khi chọn map zombie-house */}
            {mapId === "zombie-house" && <Zombie />}

            <CameraController target={playerRef} />

            <LocalPlayerController playerRef={playerRef} />

            <BombController playerRef={playerRef} />

            <RemotePlayers />
            <BulletEffects />
        </group>
    );
}
