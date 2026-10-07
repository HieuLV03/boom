
"use client";

import {
    useState,
} from "react";

import {
    useRouter,
} from "next/navigation";

import client from "@/lib/colyseus";

import {
    useMultiplayerStore,
} from "@/stores/multiplayer.store";

import "./page.css";


// ============================================================
// GENERATE ROOM CODE
// ============================================================

function generateRoomCode(): string {

    return Math.floor(
        100000 +
        Math.random() * 900000
    ).toString();

}


// ============================================================
// PAGE
// ============================================================

export default function MultiplayerPage() {

    const router =
        useRouter();


    // ========================================================
    // MULTIPLAYER STORE
    // ========================================================

    const setRoom =
        useMultiplayerStore(
            (state) =>
                state.setRoom
        );


    // ========================================================
    // LOCAL STATE
    // ========================================================

    const [
        name,
        setName,
    ] = useState("");


    const [
        roomCode,
        setRoomCode,
    ] = useState("");


    const [
        status,
        setStatus,
    ] = useState(
        "Chưa kết nối"
    );


    // ========================================================
    // CREATE ROOM
    // ========================================================

    async function createRoom() {

        try {

            setStatus(
                "Đang tạo phòng..."
            );


            const code =
                generateRoomCode();


            console.log(
                "[ROOM CODE CREATED]",
                code
            );


            const room =
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


            setRoom(room);


            console.log(
                "========================================"
            );

            console.log(
                "[CREATE] Room created"
            );

            console.log(
                "[CREATE] roomId:",
                room.roomId
            );

            console.log(
                "[CREATE] sessionId:",
                room.sessionId
            );

            console.log(
                "[CREATE] roomCode:",
                code
            );

            console.log(
                "========================================"
            );


            router.push(
                `/game?room=${encodeURIComponent(
                    room.roomId
                )}` +
                `&session=${encodeURIComponent(
                    room.sessionId
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


            const room =
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


            setRoom(room);


            console.log(
                "========================================"
            );

            console.log(
                "[JOIN] Room joined"
            );

            console.log(
                "[JOIN] roomId:",
                room.roomId
            );

            console.log(
                "[JOIN] sessionId:",
                room.sessionId
            );

            console.log(
                "[JOIN] roomCode:",
                code
            );

            console.log(
                "========================================"
            );


            router.push(
                `/game?room=${encodeURIComponent(
                    room.roomId
                )}` +
                `&session=${encodeURIComponent(
                    room.sessionId
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

        <main className="multiplayer-page">

            <div className="multiplayer-card">

                <h1 className="multiplayer-title">
                    BOOM
                </h1>


                <p className="multiplayer-subtitle">
                    Multiplayer
                </p>


                {/* ==================================================
                    NAME
                ================================================== */}

                <input
                    className="multiplayer-input"
                    value={name}
                    onChange={(event) =>
                        setName(
                            event.target.value
                        )
                    }
                    placeholder="Tên người chơi"
                />


                {/* ==================================================
                    CREATE ROOM
                ================================================== */}

                <button
                    type="button"
                    className="multiplayer-button multiplayer-button-create"
                    onClick={createRoom}
                >
                    Tạo phòng
                </button>


                {/* ==================================================
                    DIVIDER
                ================================================== */}

                <div className="multiplayer-divider">

                    <div className="multiplayer-divider-line" />

                    <span>
                        HOẶC
                    </span>

                    <div className="multiplayer-divider-line" />

                </div>


                {/* ==================================================
                    ROOM CODE
                ================================================== */}

                <input
                    className="multiplayer-input multiplayer-room-code"
                    value={roomCode}
                    onChange={(event) => {

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
                />


                {/* ==================================================
                    JOIN ROOM
                ================================================== */}

                <button
                    type="button"
                    className="multiplayer-button multiplayer-button-join"
                    onClick={joinRoom}
                >
                    Vào phòng
                </button>


                {/* ==================================================
                    STATUS
                ================================================== */}

                <p className="multiplayer-status">
                    {status}
                </p>

            </div>

        </main>

    );

}
