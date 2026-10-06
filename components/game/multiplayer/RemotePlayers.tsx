"use client";

import {
    useEffect,
    useRef,
    useState,
} from "react";

import { useFrame } from "@react-three/fiber";

import type { Group } from "three";

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


    useFrame(() => {

        const group =
            groupRef.current;

        if (!group || !player) {
            return;
        }


        // ----------------------------------------------------
        // POSITION
        // ----------------------------------------------------

        group.position.x =
            player.x ?? 0;

        group.position.y =
            player.y ?? 0;

        group.position.z =
            player.z ?? 0;


        // ----------------------------------------------------
        // ROTATION
        // ----------------------------------------------------

        group.rotation.y =
            player.rotation ?? 0;

    });


    return (
        <group ref={groupRef}>

            <Player
                position={[
                    0,
                    0,
                    0,
                ]}
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

    const room =
        useMultiplayerStore(
            (state) => state.room
        );


    const [
        players,
        setPlayers,
    ] =
        useState<RemotePlayerData[]>(
            []
        );


    // ========================================================
    // SYNC PLAYERS
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


        const $ =
            getStateCallbacks(room);


        // ====================================================
        // PLAYER CHANGE LISTENERS
        // ====================================================

        const playerChangeListeners =
            new Map<
                string,
                () => void
            >();


        // ====================================================
        // REFRESH PLAYERS
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
        // BIND PLAYER CHANGE
        // ====================================================

        const bindPlayerChange =
            (
                player: any,
                id: string
            ) => {

                // Không cần theo dõi chính mình
                if (
                    id ===
                    room.sessionId
                ) {
                    return;
                }


                // Đã bind rồi thì không bind lại
                if (
                    playerChangeListeners.has(
                        id
                    )
                ) {
                    return;
                }


                const unsubscribe =
                    $(player).onChange(
                        () => {

                            // Server thay đổi:
                            //
                            // player.hp
                            //
                            // player.x
                            //
                            // player.z
                            //
                            // player.alive
                            //
                            // ...

                            refreshPlayers();

                        }
                    );


                if (
                    typeof unsubscribe ===
                    "function"
                ) {

                    playerChangeListeners.set(
                        id,
                        unsubscribe
                    );

                }

            };


        // ====================================================
        // PLAYER ADD
        // ====================================================

        const removeAddListener =
            $(playersMap).onAdd(
                (
                    player: any,
                    id: string
                ) => {

                    if (
                        id ===
                        room.sessionId
                    ) {
                        return;
                    }


                    // Quan trọng:
                    //
                    // Player mới join cũng phải
                    // được đăng ký onChange().
                    //
                    bindPlayerChange(
                        player,
                        id
                    );


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

                    if (
                        id ===
                        room.sessionId
                    ) {
                        return;
                    }


                    // Hủy listener của player
                    // đã rời phòng.

                    const unsubscribe =
                        playerChangeListeners.get(
                            id
                        );


                    if (
                        typeof unsubscribe ===
                        "function"
                    ) {

                        unsubscribe();

                    }


                    playerChangeListeners.delete(
                        id
                    );


                    refreshPlayers();

                }
            );


        // ====================================================
        // BIND PLAYERS ĐÃ TỒN TẠI
        // ====================================================

        playersMap.forEach(
            (
                player: any,
                id: string
            ) => {

                bindPlayerChange(
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
        // CLEANUP
        // ====================================================

        return () => {

            removeAddListener?.();

            removeRemoveListener?.();


            playerChangeListeners.forEach(
                (
                    unsubscribe
                ) => {

                    unsubscribe();

                }
            );


            playerChangeListeners.clear();

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