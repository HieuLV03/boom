
"use client";

import {
    Suspense,
} from "react";

import {
    useSearchParams,
} from "next/navigation";

import BoomGame from "@/components/game/BoomGame/BoomGame";

import "./game.css";


// ============================================================
// GAME PAGE CONTENT
// ============================================================

function GamePageContent() {

    const searchParams =
        useSearchParams();


    const roomCode =
        searchParams.get("code") || "";


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
