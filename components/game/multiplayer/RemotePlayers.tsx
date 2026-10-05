
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


        // ----------------------------------------------------
        // REFRESH
        // ----------------------------------------------------

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
        // QUAN TRỌNG
        // ====================================================
        //
        // Đăng ký listener TRƯỚC khi refresh.
        //
        // Tránh trường hợp:
        //
        // refresh()
        // ↓
        // player mới xuất hiện
        // ↓
        // onAdd chưa được đăng ký
        // ↓
        // mất event
        //
        // ====================================================


        const removeAddListener =
            $(playersMap).onAdd(
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


                    refreshPlayers();

                }
            );


        // ====================================================
        // SAU KHI LISTENER ĐÃ ĐƯỢC ĐĂNG KÝ
        // MỚI ĐỌC STATE HIỆN TẠI
        // ====================================================

        refreshPlayers();


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
