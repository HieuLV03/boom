
"use client";

import {
    Suspense,
    useEffect,
    useState,
} from "react";

import {
    useSearchParams,
} from "next/navigation";

import BoomGame from "@/components/game/BoomGame/BoomGame";

import "./page.css";


// ============================================================
// GAME PAGE CONTENT
// ============================================================

function GamePageContent() {

    const searchParams =
        useSearchParams();

    const roomCode =
        searchParams.get("code") || "";


    const [ready, setReady] =
        useState(false);

    const [isLandscape, setIsLandscape] =
        useState(true);


    // ========================================================
    // CHECK ORIENTATION
    // ========================================================

    useEffect(() => {

        const checkOrientation = () => {

            const isMobile =
                window.matchMedia(
                    "(max-width: 800px)"
                ).matches;

            const landscape =
                window.matchMedia(
                    "(orientation: landscape)"
                ).matches;


            /*
             * Desktop:
             * Không bắt xoay.
             *
             * Mobile:
             * Bắt buộc phải xoay ngang.
             */
            setIsLandscape(
                !isMobile || landscape
            );

            setReady(true);
        };


        checkOrientation();


        window.addEventListener(
            "resize",
            checkOrientation
        );

        window.addEventListener(
            "orientationchange",
            checkOrientation
        );


        return () => {

            window.removeEventListener(
                "resize",
                checkOrientation
            );

            window.removeEventListener(
                "orientationchange",
                checkOrientation
            );
        };

    }, []);


    // ========================================================
    // LOADING
    // ========================================================

    if (!ready) {

        return (
            <div className="game-loading">
                Đang tải game...
            </div>
        );
    }


    // ========================================================
    // PORTRAIT
    // ========================================================

    if (!isLandscape) {

        return (
            <div className="landscape-gate">

                {/* PHONE */}
                <div className="landscape-phone">
                    📱
                </div>


                {/* ARROW */}
                <div className="landscape-arrow">
                    ↔️
                </div>


                {/* TITLE */}
                <div className="landscape-title">
                    XOAY NGANG ĐIỆN THOẠI
                </div>


                {/* DESCRIPTION */}
                <div className="landscape-description">
                    Vui lòng xoay điện thoại sang
                    chế độ ngang để chơi game.
                </div>


                {/* HINT */}
                <div className="landscape-hint">
                    Game yêu cầu màn hình ngang
                </div>

            </div>
        );
    }


    // ========================================================
    // LANDSCAPE
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
