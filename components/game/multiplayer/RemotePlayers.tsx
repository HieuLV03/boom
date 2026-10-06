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
            id
        );

        return () => {

            console.log(
                "[REMOTE PLAYER] Unmounted:",
                id
            );

        };

    }, [id]);


    // ========================================================
    // UPDATE POSITION EVERY FRAME
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
        player.name ||
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
        useState<RemotePlayerData[]>(
            []
        );


    // ========================================================
    // ROOM / STATE SYNC
    // ========================================================

    useEffect(() => {

        console.log(
            "========================================"
        );

        console.log(
            "[REMOTE] Room changed"
        );

        console.log(
            "[REMOTE] room:",
            room
        );

        if (!room) {

            console.log(
                "[REMOTE] ❌ No room"
            );

            setPlayers([]);

            return;
        }


        console.log(
            "[REMOTE] sessionId:",
            room.sessionId
        );


        // ====================================================
        // WAIT FOR STATE
        // ====================================================

        const syncPlayers =
            () => {

                const playersMap =
                    room.state?.players;


                if (!playersMap) {

                    console.warn(
                        "[REMOTE] ❌ players map not ready"
                    );

                    setPlayers([]);

                    return;
                }


                console.log(
                    "[REMOTE] players.size:",
                    playersMap.size
                );


                const result:
                    RemotePlayerData[] =
                    [];


                playersMap.forEach(
                    (
                        player: any,
                        id: string
                    ) => {

                        console.log(
                            "[REMOTE] Player in state:",
                            {
                                id,
                                name:
                                    player.name,

                                x:
                                    player.x,

                                y:
                                    player.y,

                                z:
                                    player.z,

                                hp:
                                    player.hp,

                                alive:
                                    player.alive,

                                isLocal:
                                    id ===
                                    room.sessionId,
                            }
                        );


                        // ====================================
                        // KHÔNG RENDER LOCAL
                        // ====================================

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


                console.log(
                    "[REMOTE] Remote players:",
                    result.length
                );


                setPlayers(
                    result
                );

            };


        // ====================================================
        // INITIAL SYNC
        // ====================================================

        syncPlayers();


        // ====================================================
        // COLYSEUS CALLBACKS
        // ====================================================

        const $ =
            getStateCallbacks(room);


        const playersMap =
            room.state?.players;


        if (!playersMap) {

            console.warn(
                "[REMOTE] ❌ playersMap missing"
            );

            return;
        }


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
                            id,
                            name:
                                player.name,

                            x:
                                player.x,

                            y:
                                player.y,

                            z:
                                player.z,

                            local:
                                id ===
                                room.sessionId,
                        }
                    );


                    syncPlayers();


                    // ========================================
                    // PLAYER STATE CHANGE
                    // ========================================

                    $(player).onChange(
                        () => {

                            /*
                             * Không cần setPlayers
                             * ở mỗi frame.
                             *
                             * RemotePlayer đọc trực tiếp
                             * player.x/y/z trong useFrame.
                             *
                             * Chỉ log khi state thay đổi
                             * nếu cần debug.
                             */

                            console.log(
                                "[REMOTE] Player changed:",
                                id,
                                {
                                    x:
                                        player.x,

                                    y:
                                        player.y,

                                    z:
                                        player.z,

                                    rotation:
                                        player.rotation,

                                    hp:
                                        player.hp,

                                    alive:
                                        player.alive,
                                }
                            );

                        }
                    );

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
                        id,
                        name:
                            player.name,

                        x:
                            player.x,

                        y:
                            player.y,

                        z:
                            player.z,
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
                room.sessionId
            );

            

            removeAdd?.();

            removeRemove?.();

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
                        id={id}
                        player={player}
                    />

                )
            )}

        </group>
    );
}