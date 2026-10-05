
"use client";

import {
    useEffect,
    useRef,
    useState,
} from "react";

import { useFrame } from "@react-three/fiber";

import type { Group } from "three";

import Player from "./Player";

import { useMultiplayerStore } from "@/stores/multiplayer.store";


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


    useFrame(() => {

        const group =
            groupRef.current;

        if (!group) {
            return;
        }


        if (!player) {
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


    return (
        <group ref={groupRef}>
            <Player
                position={[0, 0, 0]}
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


        const refreshPlayers =
            () => {

                const result: RemotePlayerData[] =
                    [];


                playersMap.forEach(
                    (
                        player: any,
                        id: string
                    ) => {

                        if (
                            id === room.sessionId
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


        // ----------------------------------------------------
        // INITIAL PLAYERS
        // ----------------------------------------------------

        refreshPlayers();


        // ----------------------------------------------------
        // PLAYER JOIN
        // ----------------------------------------------------

        const onAdd =
            (
                _player: any,
                id: string
            ) => {

                if (
                    id === room.sessionId
                ) {
                    return;
                }


                refreshPlayers();
            };


        // ----------------------------------------------------
        // PLAYER LEAVE
        // ----------------------------------------------------

        const onRemove =
            (
                _player: any,
                id: string
            ) => {

                if (
                    id === room.sessionId
                ) {
                    return;
                }


                refreshPlayers();
            };


        playersMap.onAdd(onAdd);
        playersMap.onRemove(onRemove);


        return () => {

            // Colyseus Schema Map handles
            // its own listeners lifecycle.
            // We intentionally don't recreate
            // the room or modify its state here.
        };

    }, [room]);


    if (!room) {
        return null;
    }


    return (
        <group>
            {players.map(
                ({ id, player }) => (
                    <RemotePlayer
                        key={id}
                        player={player}
                    />
                )
            )}
        </group>
    );
}
