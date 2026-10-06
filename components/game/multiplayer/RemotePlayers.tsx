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
    player,
}: {
    player: any;
}) {

    const groupRef =
        useRef<Group>(null);


    // ========================================================
    // FRAME
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


        // ====================================================
        // POSITION
        // ====================================================

        group.position.set(
            Number(player.x ?? 0),
            Number(player.y ?? 0),
            Number(player.z ?? 0)
        );


        // ====================================================
        // ROTATION
        // ====================================================

        group.rotation.y =
            Number(
                player.rotation ?? 0
            );

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
                rotation={0}
                hp={
                    Number(
                        player.hp ?? 100
                    )
                }
            />

        </group>
    );
}


// ============================================================
// REMOTE PLAYERS
// ============================================================

export default function RemotePlayers() {

    // ========================================================
    // ROOM
    // ========================================================

    const room =
        useMultiplayerStore(
            (state) =>
                state.room
        );


    // ========================================================
    // PLAYERS
    // ========================================================

    const [
        players,
        setPlayers,
    ] =
        useState<
            RemotePlayerData[]
        >([]);


    // ========================================================
    // SYNC
    // ========================================================

    useEffect(() => {

        /*
         * Không có room
         */
        if (!room) {

            console.log(
                "[REMOTE] No room"
            );

            setPlayers([]);

            return;
        }


        console.log(
            "[REMOTE] Room connected:",
            room.sessionId
        );


        const playersMap =
            room.state?.players;


        /*
         * Room chưa có players
         */
        if (!playersMap) {

            console.warn(
                "[REMOTE] room.state.players not found"
            );

            setPlayers([]);

            return;
        }


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

                        /*
                         * Không render chính mình
                         */

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


                        console.log(
                            "[REMOTE] Player:",
                            id,
                            "position:",
                            player.x,
                            player.y,
                            player.z
                        );

                    }
                );


                setPlayers(
                    result
                );

            };


        // ====================================================
        // PLAYER STATE LISTENERS
        // ====================================================

        const playerListeners =
            new Map<
                string,
                () => void
            >();


        // ====================================================
        // BIND PLAYER
        // ====================================================

        const bindPlayer =
            (
                player: any,
                id: string
            ) => {

                /*
                 * Không bind local player
                 */

                if (
                    id ===
                    room.sessionId
                ) {
                    return;
                }


                /*
                 * Đã bind
                 */

                if (
                    playerListeners.has(
                        id
                    )
                ) {
                    return;
                }


                console.log(
                    "[REMOTE] Binding player:",
                    id
                );


                const unsubscribe =
                    $(player).onChange(
                        () => {

                            /*
                             * Schema object tự cập nhật.
                             *
                             * RemotePlayer đọc trực tiếp
                             * player.x / player.z trong useFrame.
                             *
                             * Không nhất thiết phải setState
                             * cho mỗi movement.
                             */

                            console.log(
                                "[REMOTE] Update:",
                                id,
                                {
                                    x: player.x,
                                    y: player.y,
                                    z: player.z,
                                    rotation:
                                        player.rotation,
                                    hp:
                                        player.hp,
                                }
                            );

                        }
                    );


                if (
                    typeof unsubscribe ===
                    "function"
                ) {

                    playerListeners.set(
                        id,
                        unsubscribe
                    );

                }

            };


        // ====================================================
        // EXISTING PLAYERS
        // ====================================================

        console.log(
            "[REMOTE] Existing players:",
            playersMap.size
        );


        playersMap.forEach(
            (
                player: any,
                id: string
            ) => {

                console.log(
                    "[REMOTE] Existing player:",
                    id
                );


                bindPlayer(
                    player,
                    id
                );

            }
        );


        // ====================================================
        // INITIAL REFRESH
        // ====================================================

        refreshPlayers();


        // ====================================================
        // PLAYER ADD
        // ====================================================

        const removeAddListener =
            $(playersMap).onAdd(
                (
                    player: any,
                    id: string
                ) => {

                    console.log(
                        "[REMOTE] 🧍 Player added:",
                        id
                    );


                    /*
                     * Local player
                     */

                    if (
                        id ===
                        room.sessionId
                    ) {

                        console.log(
                            "[REMOTE] Local player ignored:",
                            id
                        );

                        return;
                    }


                    /*
                     * Bind Schema
                     */

                    bindPlayer(
                        player,
                        id
                    );


                    /*
                     * Refresh React list
                     */

                    refreshPlayers();

                }
            );


        // ====================================================
        // PLAYER REMOVE
        // ====================================================

        const removeRemoveListener =
            $(playersMap).onRemove(
                (
                    _player: any,
                    id: string
                ) => {

                    console.log(
                        "[REMOTE] ❌ Player removed:",
                        id
                    );


                    const unsubscribe =
                        playerListeners.get(
                            id
                        );


                    if (
                        typeof unsubscribe ===
                        "function"
                    ) {

                        unsubscribe();

                    }


                    playerListeners.delete(
                        id
                    );


                    refreshPlayers();

                }
            );


        // ====================================================
        // CLEANUP
        // ====================================================

        return () => {

            console.log(
                "[REMOTE] Cleanup"
            );


            removeAddListener?.();

            removeRemoveListener?.();


            playerListeners.forEach(
                (
                    unsubscribe
                ) => {

                    unsubscribe();

                }
            );


            playerListeners.clear();

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