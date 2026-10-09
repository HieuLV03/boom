
"use client";

import {
    Suspense,
} from "react";

import {
    useSearchParams,
} from "next/navigation";

import BoomGame from "@/components/game/BoomGame/BoomGame";

import LandscapeGuard from "@/components/game/LandscapeGuard/LandscapeGuard";

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
        <LandscapeGuard>

            <BoomGame
                roomCode={roomCode}
            />

        </LandscapeGuard>
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
