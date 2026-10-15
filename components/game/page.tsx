
"use client";

import {
    Suspense,
} from "react";
import GameAssetPreloader from "@/components/game/GameAssetPreloader/GameAssetPreloader";

import {
    useSearchParams,
} from "next/navigation";

import MainGame from "@/components/game/MainGame/MainGame";

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
        <GameAssetPreloader />

            <MainGame
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
