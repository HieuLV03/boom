
"use client";

import {
    Suspense,
    useEffect,
    useState,
} from "react";

import {
    useRouter,
    useSearchParams,
} from "next/navigation";

import BoomGame from "@/components/game/BoomGame/BoomGame";

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
    // LOCAL STATE
    // ========================================================

    const [
        ready,
        setReady,
    ] = useState(false);


    const [
        isLandscape,
        setIsLandscape,
    ] = useState(true);


    // ========================================================
    // ROOM GUARD
    // ========================================================
    //
    // Nếu /game không còn room Colyseus,
    // tuyệt đối không được render game.
    //
    // ========================================================

    useEffect(() => {

        if (room) {

            console.log(
                "[GAME PAGE] Active room:",
                {
                    roomId:
                        room.roomId,

                    sessionId:
                        room.sessionId,
                }
            );

            return;
        }


        /*
         * Không có room.
         *
         * Có thể xảy ra khi:
         *
         * 1. Người chơi bấm OUT.
         * 2. Connection bị mất.
         * 3. Người chơi truy cập /game trực tiếp.
         */

        console.log(
            "[GAME PAGE] ❌ No active room"
        );


        router.replace(
            "/multiplayer"
        );

    }, [
        room,
        router,
    ]);


    // ========================================================
    // CHECK ORIENTATION
    // ========================================================

    useEffect(() => {

        const checkOrientation =
            () => {

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
                    !isMobile ||
                    landscape
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
    // NO ROOM
    // ========================================================
    //
    // Không render BoomGame nếu không còn room.
    //
    // ========================================================

    if (!room) {

        return (
            <div className="game-loading">
                Đang thoát phòng...
            </div>
        );

    }


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

                {/* ==================================================
                    PHONE
                ================================================== */}

                <div className="landscape-phone">
                    📱
                </div>


                {/* ==================================================
                    ARROW
                ================================================== */}

                <div className="landscape-arrow">
                    ↔️
                </div>


                {/* ==================================================
                    TITLE
                ================================================== */}

                <div className="landscape-title">
                    XOAY NGANG ĐIỆN THOẠI
                </div>


                {/* ==================================================
                    DESCRIPTION
                ================================================== */}

                <div className="landscape-description">
                    Vui lòng xoay điện thoại sang
                    chế độ ngang để chơi game.
                </div>


                {/* ==================================================
                    HINT
                ================================================== */}

                <div className="landscape-hint">
                    Game yêu cầu màn hình ngang
                </div>

            </div>
        );

    }


    // ========================================================
    // LANDSCAPE + ROOM
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
