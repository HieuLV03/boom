
"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import GameAssetPreloader from "@/components/game/GameAssetPreloader/GameAssetPreloader";
import MainGame from "@/components/game/MainGame/MainGame";

import "./game.css";

function GamePageContent() {
    const searchParams = useSearchParams();
    const roomCode = searchParams.get("code") || "";

    return (
        <>
            <GameAssetPreloader />

            <MainGame roomCode={roomCode} />
        </>
    );
}

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
