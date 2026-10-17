
"use client";

import { useRef } from "react";
import type { Group } from "three";

import WeaponController
    from "./weapons/WeaponController";

import ScareObject from "./ScareObject";
import BulletEffects from "./BulletEffects";
import MapRenderer from "./maps/MapRenderer";
import Zombie from "./Zombie/Zombie";

import CameraController
    from "./camera/CameraController";

import LocalPlayerController
    from "./player/LocalPlayerController";

import RemotePlayers
    from "./multiplayer/RemotePlayers";

import BombController
    from "./bomb/BombController";

interface GameWorldProps {
    mapId?: string;
}

export default function GameWorld({
    mapId = "tropical-village",
}: GameWorldProps) {
    const playerRef = useRef<Group>(null);

    return (
        <group>
            <MapRenderer mapId={mapId as any} />

            <ScareObject />

            {/* Quản lý vũ khí và hiển thị pickup */}
            <WeaponController
                playerRef={playerRef}
            />

            {/* Zombie chỉ xuất hiện trong map zombie-house */}
            {mapId === "zombie-house" && (
                <Zombie />
            )}

            <CameraController target={playerRef} />

            <LocalPlayerController
                playerRef={playerRef}
            />

            <BombController
                playerRef={playerRef}
            />

            <RemotePlayers />
            <BulletEffects />
        </group>
    );
}
