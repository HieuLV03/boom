"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import client from "@/lib/colyseus";

import {
    useMultiplayerStore,
} from "@/stores/multiplayer.store";


// ============================================================
// GENERATE ROOM CODE
// ============================================================

function generateRoomCode(): string {
    return Math.floor(
        100000 + Math.random() * 900000
    ).toString();
}


// ============================================================
// PAGE
// ============================================================

export default function MultiplayerPage() {

    const router = useRouter();


    // ========================================================
    // MULTIPLAYER STORE
    // ========================================================

    const room =
        useMultiplayerStore(
            (state) => state.room
        );

    const setRoom =
        useMultiplayerStore(
            (state) => state.setRoom
        );

    const clearRoom =
        useMultiplayerStore(
            (state) => state.clearRoom
        );


    // ========================================================
    // LOCAL STATE
    // ========================================================

    const [name, setName] =
        useState("");

    const [roomCode, setRoomCode] =
        useState("");

    const [status, setStatus] =
        useState("Chưa kết nối");


    // ========================================================
    // LEAVE OLD ROOM
    // ========================================================

    async function leaveCurrentRoom() {

        const currentRoom =
            useMultiplayerStore
                .getState()
                .room;


        if (!currentRoom) {
            return;
        }


        console.log(
            "[ROOM] Leaving old room:",
            {
                roomId:
                    currentRoom.roomId,

                sessionId:
                    currentRoom.sessionId,
            }
        );


        try {

            await currentRoom.leave();

        }
        catch (error) {

            console.warn(
                "[ROOM] Error leaving old room:",
                error
            );

        }
        finally {

            useMultiplayerStore
                .getState()
                .clearRoom();

        }

    }


    // ========================================================
    // CREATE ROOM
    // ========================================================

    async function createRoom() {

        try {

            setStatus(
                "Đang tạo phòng..."
            );


            // ==================================================
            // IMPORTANT:
            // LEAVE OLD ROOM FIRST
            // ==================================================

            await leaveCurrentRoom();


            // ==================================================
            // GENERATE ROOM CODE
            // ==================================================

            const code =
                generateRoomCode();


            console.log(
                "========================================"
            );

            console.log(
                "[ROOM] Creating new room"
            );

            console.log(
                "[ROOM CODE]",
                code
            );


            // ==================================================
            // CREATE COLYSEUS ROOM
            // ==================================================

            const newRoom =
                await client.create(
                    "battle",
                    {
                        name:
                            name.trim() ||
                            "Player",

                        roomCode:
                            code,
                    }
                );


            // ==================================================
            // SAVE NEW ROOM
            // ==================================================

            setRoom(
                newRoom
            );


            // ==================================================
            // DEBUG
            // ==================================================

            console.log(
                "[ROOM CREATED]",
                {
                    roomId:
                        newRoom.roomId,

                    sessionId:
                        newRoom.sessionId,

                    roomCode:
                        code,
                }
            );


            console.log(
                "[ROOM] New room saved"
            );


            // ==================================================
            // GO TO GAME
            // ==================================================

            router.push(
                `/game?room=${encodeURIComponent(
                    newRoom.roomId
                )}` +
                `&session=${encodeURIComponent(
                    newRoom.sessionId
                )}` +
                `&code=${encodeURIComponent(
                    code
                )}`
            );

        }
        catch (error) {

            console.error(
                "[CREATE ROOM ERROR]",
                error
            );


            setStatus(
                "Không thể tạo phòng"
            );

        }

    }


    // ========================================================
    // JOIN ROOM
    // ========================================================

    async function joinRoom() {

        const code =
            roomCode.trim();


        // ====================================================
        // VALIDATE
        // ====================================================

        if (
            !/^\d{6}$/.test(code)
        ) {

            setStatus(
                "Mã phòng phải gồm 6 chữ số"
            );

            return;
        }


        try {

            setStatus(
                "Đang vào phòng..."
            );


            // ==================================================
            // IMPORTANT:
            // LEAVE OLD ROOM FIRST
            // ==================================================

            await leaveCurrentRoom();


            // ==================================================
            // JOIN
            // ==================================================

            console.log(
                "========================================"
            );

            console.log(
                "[ROOM] Joining room"
            );

            console.log(
                "[ROOM CODE]",
                code
            );


            const newRoom =
                await client.join(
                    "battle",
                    {
                        name:
                            name.trim() ||
                            "Player",

                        roomCode:
                            code,
                    }
                );


            // ==================================================
            // SAVE NEW ROOM
            // ==================================================

            setRoom(
                newRoom
            );


            // ==================================================
            // DEBUG
            // ==================================================

            console.log(
                "[ROOM JOINED]",
                {
                    roomId:
                        newRoom.roomId,

                    sessionId:
                        newRoom.sessionId,

                    roomCode:
                        code,
                }
            );


            console.log(
                "[ROOM] New room saved"
            );


            // ==================================================
            // GO TO GAME
            // ==================================================

            router.push(
                `/game?room=${encodeURIComponent(
                    newRoom.roomId
                )}` +
                `&session=${encodeURIComponent(
                    newRoom.sessionId
                )}` +
                `&code=${encodeURIComponent(
                    code
                )}`
            );

        }
        catch (error) {

            console.error(
                "[JOIN ROOM ERROR]",
                error
            );


            setStatus(
                "Không tìm thấy phòng"
            );

        }

    }


    // ========================================================
    // UI
    // ========================================================

    return (

        <main
            style={{
                minHeight: "100vh",

                display: "flex",

                alignItems: "center",

                justifyContent: "center",

                padding: 20,

                background:
                    "#111827",

                color: "#fff",
            }}
        >

            <div
                style={{
                    width: "100%",

                    maxWidth: 420,

                    padding: 24,

                    borderRadius: 20,

                    background:
                        "#1f2937",

                    boxSizing:
                        "border-box",

                    display: "flex",

                    flexDirection:
                        "column",

                    gap: 14,
                }}
            >

                {/* ==================================================
                    TITLE
                ================================================== */}

                <h1
                    style={{
                        margin: 0,

                        textAlign:
                            "center",

                        fontSize: 32,

                        fontWeight: 800,
                    }}
                >
                    BOOM
                </h1>


                <p
                    style={{
                        margin: 0,

                        textAlign:
                            "center",

                        color:
                            "#9ca3af",
                    }}
                >
                    Multiplayer
                </p>


                {/* ==================================================
                    NAME
                ================================================== */}

                <input
                    value={name}

                    onChange={(
                        event
                    ) =>
                        setName(
                            event.target.value
                        )
                    }

                    placeholder="Tên người chơi"

                    style={{
                        width: "100%",

                        boxSizing:
                            "border-box",

                        padding: 14,

                        borderRadius: 10,

                        border: "none",

                        outline: "none",

                        fontSize: 16,
                    }}
                />


                {/* ==================================================
                    CREATE ROOM
                ================================================== */}

                <button
                    type="button"

                    onClick={
                        createRoom
                    }

                    style={{
                        width: "100%",

                        padding: 14,

                        border: "none",

                        borderRadius: 10,

                        background:
                            "#2563eb",

                        color: "#fff",

                        fontSize: 16,

                        fontWeight: 700,

                        cursor: "pointer",
                    }}
                >
                    Tạo phòng
                </button>


                {/* ==================================================
                    DIVIDER
                ================================================== */}

                <div
                    style={{
                        display:
                            "flex",

                        alignItems:
                            "center",

                        gap: 10,

                        color:
                            "#6b7280",

                        fontSize: 13,
                    }}
                >

                    <div
                        style={{
                            flex: 1,

                            height: 1,

                            background:
                                "#374151",
                        }}
                    />

                    HOẶC

                    <div
                        style={{
                            flex: 1,

                            height: 1,

                            background:
                                "#374151",
                        }}
                    />

                </div>


                {/* ==================================================
                    ROOM CODE
                ================================================== */}

                <input
                    value={roomCode}

                    onChange={(
                        event
                    ) => {

                        const value =
                            event.target.value
                                .replace(
                                    /\D/g,
                                    ""
                                )
                                .slice(
                                    0,
                                    6
                                );

                        setRoomCode(
                            value
                        );

                    }}

                    placeholder="Nhập mã phòng 6 số"

                    inputMode="numeric"

                    maxLength={6}

                    style={{
                        width: "100%",

                        boxSizing:
                            "border-box",

                        padding: 14,

                        borderRadius: 10,

                        border: "none",

                        outline: "none",

                        fontSize: 16,

                        letterSpacing: 2,
                    }}
                />


                {/* ==================================================
                    JOIN ROOM
                ================================================== */}

                <button
                    type="button"

                    onClick={
                        joinRoom
                    }

                    style={{
                        width: "100%",

                        padding: 14,

                        border: "none",

                        borderRadius: 10,

                        background:
                            "#374151",

                        color: "#fff",

                        fontSize: 16,

                        fontWeight: 700,

                        cursor: "pointer",
                    }}
                >
                    Vào phòng
                </button>


                {/* ==================================================
                    STATUS
                ================================================== */}

                <p
                    style={{
                        margin: 0,

                        minHeight: 20,

                        textAlign:
                            "center",

                        color:
                            "#9ca3af",

                        fontSize: 14,
                    }}
                >
                    {status}
                </p>

            </div>

        </main>
    );
}