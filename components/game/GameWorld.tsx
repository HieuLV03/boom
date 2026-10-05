
"use client";

import { useRef } from "react";

import type { Group } from "three";

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
        </group>
    );
}
