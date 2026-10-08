
"use client";

import {
    Suspense,
    useEffect,
} from "react";

import {
    useRouter,
    useSearchParams,
} from "next/navigation";

import BoomGame
    from "@/components/game/BoomGame/BoomGame";

import {
    useMultiplayerStore,
} from "@/stores/multiplayer.store";

import "./page.css";


// ============================================================
// GAME PAGE CONTENT
// ============================================================

function GamePageContent() {

    const router =
        useRouter();


    const searchParams =
        useSearchParams();


    // ========================================================
    // ROOM CODE
    // ========================================================

    const roomCode =
        searchParams.get("code") || "";


    // ========================================================
    // ROOM
    // ========================================================

    const room =
        useMultiplayerStore(
            (state) =>
                state.room
        );


    // ========================================================
    // ROOM CHECK
    // ========================================================
    //
    // GamePage KHÔNG xử lý:
    //
    // - room.leave()
    // - room.onLeave()
    // - clearRoom()
    //
    // BoomGame sẽ xử lý OUT.
    //
    // GamePage chỉ kiểm tra:
    //
    // Có room → chơi
    // Không có room → về multiplayer
    //
    // ========================================================

    useEffect(() => {

        if (!room) {

            console.log(
                "[GAME PAGE] ❌ No active room"
            );


            router.replace(
                "/multiplayer"
            );


            return;

        }


        console.log(
            "========================================"
        );

        console.log(
            "[GAME PAGE] ✅ Active room"
        );

        console.log(
            "[GAME PAGE] roomId:",
            room.roomId
        );

        console.log(
            "[GAME PAGE] sessionId:",
            room.sessionId
        );

        console.log(
            "[GAME PAGE] roomCode:",
            roomCode
        );

        console.log(
            "========================================"
        );

    }, [
        room,
        roomCode,
        router,
    ]);


    // ========================================================
    // NO ROOM
    // ========================================================

    if (!room) {

        return (
            <div className="game-loading">

                Đang quay về phòng...

            </div>
        );

    }


    // ========================================================
    // GAME
    // ========================================================

    return (
        <BoomGame
            roomCode={roomCode}
        />
    );

}


// ============================================================
// GAME PAGE
// ============================================================

export default function GamePage() {

    return (

        <Suspense
            fallback={
                <div className="game-loading">

                    Đang tải game...

                </div>
            }
        >

            <GamePageContent />

        </Suspense>

    );

}
