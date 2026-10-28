
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

function getEquippedWeapon(player: any): string {
    const slot = Number(player?.equippedSlot ?? 0);

    const weapon1 = String(player?.weapon1 ?? "")
        .trim()
        .toLowerCase();

    const weapon2 = String(player?.weapon2 ?? "")
        .trim()
        .toLowerCase();

    if (slot === 1) return weapon1;
    if (slot === 2) return weapon2;

    return "";
}

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

const groupRef = useRef<Group>(null);

const room = useMultiplayerStore(
    (state) => state.room
);
const lastSentMoving = useRef<boolean | null>(null);

const [moving, setMoving] = useState(Boolean(player?.moving));
const [movingBackward, setMovingBackward] = useState(
    Boolean(player?.movingBackward)
);
const [running, setRunning] = useState(Boolean(player?.running));
const [crouching, setCrouching] = useState(
    Boolean(player?.crouching)
);
const [jumpTrigger, setJumpTrigger] = useState(
    Number(player?.jumpTrigger ?? 0)
);

const [aiming, setAiming] = useState(Boolean(player?.aiming));

const [hp, setHp] = useState(
    Number(player?.hp ?? 100)
);

const [hitTrigger, setHitTrigger] = useState(0);
const previousHpRef = useRef(
    Number(player?.hp ?? 100)
);

const [weaponType, setWeaponType] = useState(
    getEquippedWeapon(player)
);
// Mỗi nhân vật từ xa có bộ đếm đấm riêng.
const [punchTrigger, setPunchTrigger] = useState(0);

useEffect(() => {
    if (!room || !player) return;

    const syncPlayer = () => {
        setMoving(Boolean(player.moving));
        setMovingBackward(Boolean(player.movingBackward));
        setRunning(Boolean(player.running));
        setAiming(Boolean(player.aiming));
        setCrouching(Boolean(player.crouching));
setJumpTrigger(Number(player.jumpTrigger ?? 0));
setWeaponType(getEquippedWeapon(player));

const nextHp = Number(player.hp ?? 100);
const previousHp = previousHpRef.current;

if (nextHp < previousHp) {
    setHitTrigger((value) => value + 1);

    console.log("[REMOTE HIT] Người chơi bị mất HP:", {
        id,
        previousHp,
        nextHp,
    });
}

previousHpRef.current = nextHp;
setHp(nextHp);

setPlayerName(player.name || "Player");
    };

    const $ = getStateCallbacks(room);

    syncPlayer();
    const unsubscribe = $(player).onChange(syncPlayer);

    return () => {
        unsubscribe?.();
    };
}, [room, player]);

const [playerName, setPlayerName] = useState(
    player?.name || "Player"
);
useEffect(() => {
    if (!room) return;

    const unsubscribe = room.onMessage(
        "attackPerformed",
        (message: {
            playerId?: string;
            action?: string;
        }) => {
            if (
                message.playerId === id &&
                message.action === "punch"
            ) {
                setPunchTrigger((value) => value + 1);
            }
        },
    );

    return () => {
        unsubscribe();
    };
}, [room, id]);

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
    position={[0, 0, 0]}
    hp={hp}
    hitTrigger={hitTrigger}
    moving={moving}
    movingBackward={movingBackward}
    running={running}
    crouching={crouching}
    aiming={aiming}
    weaponType={weaponType}
    punchTrigger={punchTrigger}
    jumpTrigger={jumpTrigger}
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
    if (!room) {
        console.log("[REMOTE] No room");
        setPlayers([]);
        return;
    }

    const currentRoom = room;
    const $ = getStateCallbacks(currentRoom);

    let disposed = false;
    let boundPlayersMap: any = null;

    let removeAdd: (() => void) | undefined;
    let removeRemove: (() => void) | undefined;

    const syncPlayers = (playersMap: any) => {
        if (disposed || !playersMap) return;

        const remotePlayers: RemotePlayerData[] = [];

        playersMap.forEach((player: any, id: string) => {
            if (id === currentRoom.sessionId) return;

            remotePlayers.push({ id, player });
        });

        console.log("[REMOTE] Sync players:", {
            roomId: currentRoom.roomId,
            sessionId: currentRoom.sessionId,
            total: playersMap.size,
            remote: remotePlayers.length,
            remoteIds: remotePlayers.map((p) => p.id),
        });

        setPlayers(remotePlayers);
    };

    const bindPlayersMap = () => {
        if (disposed) return;

        const playersMap = currentRoom.state?.players;

        if (!playersMap) {
            console.log("[REMOTE] Waiting for players map");
            return;
        }

        if (playersMap === boundPlayersMap) return;

        removeAdd?.();
        removeRemove?.();

        boundPlayersMap = playersMap;

        removeAdd = $(playersMap).onAdd(
            (player: any, id: string) => {
                console.log("[REMOTE] Player added:", {
                    id,
                    name: player?.name,
                    localSession: currentRoom.sessionId,
                });

                syncPlayers(playersMap);
            }
        );

        removeRemove = $(playersMap).onRemove(
            (_player: any, id: string) => {
                console.log("[REMOTE] Player removed:", id);
                syncPlayers(playersMap);
            }
        );

        syncPlayers(playersMap);
    };

    bindPlayersMap();

    const removeStateChange = currentRoom.onStateChange(() => {
        bindPlayersMap();
    });

    return () => {
        disposed = true;

        removeAdd?.();
        removeRemove?.();

        setPlayers([]);

        console.log("[REMOTE] Room listeners cleaned:", {
            roomId: currentRoom.roomId,
            sessionId: currentRoom.sessionId,
        });
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
