
"use client";

import {
    useEffect,
    useRef,
    useState,
} from "react";

import { useFrame } from "@react-three/fiber";

import type { Group } from "three";

import Player from "./Player";

import {
    useMultiplayerStore,
} from "@/stores/multiplayer.store";

import {
    getStateCallbacks,
} from "@colyseus/sdk";


// ============================================================
// TYPES
// ============================================================

type RemotePlayerData = {
    id: string;
    player: any;
};


// ============================================================
// REMOTE PLAYER
// ============================================================

function RemotePlayer({
    player,
}: {
    player: any;
}) {

    const groupRef =
        useRef<Group>(null);


    // ========================================================
    // UPDATE POSITION
    // ========================================================

    useFrame(() => {

        const group =
            groupRef.current;


        if (!group || !player) {
            return;
        }


        group.position.x =
            player.x ?? 0;

        group.position.y =
            player.y ?? 0;

        group.position.z =
            player.z ?? 0;


        group.rotation.y =
            player.rotation ?? 0;
    });


    // ========================================================
    // RENDER
    // ========================================================

    return (
        <group
            ref={groupRef}
        >
            <Player
                position={[
                    0,
                    0,
                    0,
                ]}
            />
        </group>
    );
}


// ============================================================
// REMOTE PLAYERS
// ============================================================

export default function RemotePlayers() {

    const room =
        useMultiplayerStore(
            (state) => state.room
        );


    const [players, setPlayers] =
        useState<RemotePlayerData[]>(
            []
        );


    // ========================================================
    // COLYSEUS STATE
    // ========================================================

    useEffect(() => {

        if (!room) {

            setPlayers([]);

            return;
        }


        const playersMap =
            room.state?.players;


        if (!playersMap) {

            setPlayers([]);

            return;
        }


        // ====================================================
        // COLYSEUS CALLBACKS
        // ====================================================

        const $ =
            getStateCallbacks(room);


        // ====================================================
        // REFRESH
        // ====================================================

        const refreshPlayers =
            () => {

                const result:
                    RemotePlayerData[] =
                    [];


                playersMap.forEach(
                    (
                        player: any,
                        id: string
                    ) => {

                        // Không render chính mình
                        if (
                            id ===
                            room.sessionId
                        ) {
                            return;
                        }


                        result.push({
                            id,
                            player,
                        });
                    }
                );


                setPlayers(result);
            };


        // ====================================================
        // INITIAL
        // ====================================================

        refreshPlayers();


        // ====================================================
        // PLAYER JOIN
        // ====================================================

        const removeAddListener =
            $(
                playersMap
            ).onAdd(
                (
                    _player: any,
                    id: string
                ) => {

                    if (
                        id ===
                        room.sessionId
                    ) {
                        return;
                    }


                    refreshPlayers();
                }
            );


        // ====================================================
        // PLAYER LEAVE
        // ====================================================

        const removeRemoveListener =
            $(
                playersMap
            ).onRemove(
                (
                    _player: any,
                    id: string
                ) => {

                    if (
                        id ===
                        room.sessionId
                    ) {
                        return;
                    }


                    refreshPlayers();
                }
            );


        // ====================================================
        // CLEANUP
        // ====================================================

        return () => {

            removeAddListener?.();

            removeRemoveListener?.();

        };

    }, [room]);


    // ========================================================
    // NO ROOM
    // ========================================================

    if (!room) {
        return null;
    }


    // ========================================================
    // RENDER
    // ========================================================

    return (
        <group>

            {players.map(
                ({
                    id,
                    player,
                }) => (

                    <RemotePlayer
                        key={id}
                        player={player}
                    />

                )
            )}

        </group>
    );
}
