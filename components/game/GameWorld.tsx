
"use client";
import WeaponPickupController
    from "./weapons/WeaponPickupController";
import { useRef } from "react";
import ScareObject from "./ScareObject";
import type { Group } from "three";
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

export default function GameWorld() {
    const playerRef =
        useRef<Group>(null);

    return (
        <group>
            <MapRenderer
                mapId="tropical-village"
            />
            <ScareObject />

<WeaponPickupController />
            <CameraController
                target={playerRef}
            />

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
