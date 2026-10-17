
"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import GameAssetPreloader from "@/components/game/GameAssetPreloader/GameAssetPreloader";
import MainGame from "@/components/game/MainGame/MainGame";

import "./page.css";

function GamePageContent() {
    const searchParams = useSearchParams();
    const roomCode = searchParams.get("code") || "";

    return (
        <main className="game-page-root">
            <GameAssetPreloader />

            <div className="game-main-container">
                <MainGame roomCode={roomCode} />
            </div>
        </main>
    );
}

export default function GamePage() {
    return (
        <Suspense
            fallback={
                <main className="game-page-root">
                    <div className="game-loading">
                        Đang tải game...
                    </div>
                </main>
            }
        >
            <GamePageContent />
        </Suspense>
    );
}
