
"use client";

import { useRef } from "react";
import type { Group } from "three";

import WeaponPickupController
    from "./weapons/WeaponPickupController";
import ScareObject from "./ScareObject";
import BulletEffects from "./BulletEffects";
import MapRenderer from "./maps/MapRenderer";

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
            <WeaponPickupController />

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
