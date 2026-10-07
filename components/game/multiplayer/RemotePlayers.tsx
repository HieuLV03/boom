
"use client";

import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    useFrame,
} from "@react-three/fiber";

import type {
    Group,
} from "three";

import {
    getStateCallbacks,
} from "@colyseus/sdk";

import Player from "../player/Player";

import {
    useMultiplayerStore,
} from "@/stores/multiplayer.store";


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
    id,
    player,
}: {
    id: string;
    player: any;
}) {

    const groupRef =
        useRef<Group>(null);


    // ========================================================
    // LOG
    // ========================================================

    useEffect(() => {

        console.log(
            "[REMOTE PLAYER] Mounted:",
            {
                id,
                name:
                    player?.name,
            }
        );


        return () => {

            console.log(
                "[REMOTE PLAYER] Unmounted:",
                {
                    id,
                    name:
                        player?.name,
                }
            );

        };

    }, [
        id,
        player,
    ]);


    // ========================================================
    // UPDATE POSITION
    // ========================================================

    useFrame(() => {

        const group =
            groupRef.current;


        if (
            !group ||
            !player
        ) {

            return;

        }


        const x =
            Number(
                player.x ?? 0
            );


        const y =
            Number(
                player.y ?? 0
            );


        const z =
            Number(
                player.z ?? 0
            );


        const rotation =
            Number(
                player.rotation ?? 0
            );


        group.position.set(
            x,
            y,
            z
        );


        group.rotation.y =
            rotation;

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
                name={
                    player?.name ||
                    "Player"
                }
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
            (state) =>
                state.room
        );


    const [
        players,
        setPlayers,
    ] =
        useState<RemotePlayerData[]>([]);


    // ========================================================
    // ROOM SYNC
    // ========================================================

    useEffect(() => {

        console.log(
            "========================================"
        );

        console.log(
            "[REMOTE] Room changed"
        );


        // ====================================================
        // NO ROOM
        // ====================================================

        if (!room) {

            console.log(
                "[REMOTE] ❌ No room"
            );

            setPlayers([]);

            return;

        }


        // ====================================================
        // LOCK CURRENT ROOM
        // ====================================================

        const currentRoom =
            room;


        console.log(
            "[REMOTE] ✅ Active room:",
            {
                roomId:
                    currentRoom.roomId,

                sessionId:
                    currentRoom.sessionId,
            }
        );


        // ====================================================
        // PLAYERS MAP
        // ====================================================

        const playersMap =
            currentRoom.state?.players;


        if (!playersMap) {

            console.warn(
                "[REMOTE] ❌ players map not ready"
            );

            setPlayers([]);

            return;

        }


        // ====================================================
        // COLYSEUS CALLBACKS
        // ====================================================

        const $ =
            getStateCallbacks(
                currentRoom
            );


        // ====================================================
        // SYNC PLAYERS
        // ====================================================

        const syncPlayers =
            () => {

                const remotePlayers:
                    RemotePlayerData[] =
                    [];


                playersMap.forEach(
                    (
                        player: any,
                        id: string
                    ) => {

                        // ------------------------------------
                        // Không render chính mình
                        // ------------------------------------

                        if (
                            id ===
                            currentRoom.sessionId
                        ) {

                            return;

                        }


                        remotePlayers.push({
                            id,
                            player,
                        });

                    }
                );


                console.log(
                    "[REMOTE] Sync players:",
                    {
                        roomId:
                            currentRoom.roomId,

                        sessionId:
                            currentRoom.sessionId,

                        total:
                            playersMap.size,

                        remote:
                            remotePlayers.length,
                    }
                );


                setPlayers(
                    remotePlayers
                );

            };


        // ====================================================
        // INITIAL SYNC
        // ====================================================

        syncPlayers();


        // ====================================================
        // PLAYER ADDED
        // ====================================================

        const removeAdd =
            $(playersMap).onAdd(
                (
                    player: any,
                    id: string
                ) => {

                    console.log(
                        "[REMOTE] ➕ PLAYER ADDED:",
                        {
                            roomId:
                                currentRoom.roomId,

                            localSession:
                                currentRoom.sessionId,

                            id,

                            name:
                                player?.name,

                            x:
                                player?.x,

                            y:
                                player?.y,

                            z:
                                player?.z,

                            isLocal:
                                id ===
                                currentRoom.sessionId,
                        }
                    );


                    syncPlayers();

                }
            );


        // ====================================================
        // PLAYER REMOVED
        // ====================================================

        const removeRemove =
            $(playersMap).onRemove(
                (
                    player: any,
                    id: string
                ) => {

                    console.log(
                        "[REMOTE] ❌ PLAYER REMOVED:",
                        {
                            roomId:
                                currentRoom.roomId,

                            id,

                            name:
                                player?.name,
                        }
                    );


                    syncPlayers();

                }
            );


        // ====================================================
        // EXISTING PLAYERS
        // ====================================================

        playersMap.forEach(
            (
                player: any,
                id: string
            ) => {

                console.log(
                    "[REMOTE] Existing player:",
                    {
                        roomId:
                            currentRoom.roomId,

                        id,

                        name:
                            player?.name,

                        x:
                            player?.x,

                        y:
                            player?.y,

                        z:
                            player?.z,

                        isLocal:
                            id ===
                            currentRoom.sessionId,
                    }
                );

            }
        );


        // ====================================================
        // CLEANUP
        // ====================================================

        return () => {

            console.log(
                "[REMOTE] Cleaning room listeners:",
                {
                    roomId:
                        currentRoom.roomId,

                    sessionId:
                        currentRoom.sessionId,
                }
            );


            removeAdd?.();

            removeRemove?.();


            setPlayers([]);

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

            {
                players.map(
                    ({
                        id,
                        player,
                    }) => (

                        <RemotePlayer
                            key={id}
                            id={id}
                            player={player}
                        />

                    )
                )
            }

        </group>

    );
}
