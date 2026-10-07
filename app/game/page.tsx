
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
    // ROOM LIFECYCLE
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


        const currentRoom =
            room;


        console.log(
            "========================================"
        );

        console.log(
            "[GAME PAGE] ✅ Active room"
        );

        console.log(
            "[GAME PAGE] roomId:",
            currentRoom.roomId
        );

        console.log(
            "[GAME PAGE] sessionId:",
            currentRoom.sessionId
        );

        console.log(
            "========================================"
        );


        // ====================================================
        // ROOM LEAVE
        // ====================================================

        currentRoom.onLeave?.(
            (
                code
            ) => {

                console.log(
                    "[GAME PAGE] ❌ Room left:",
                    {
                        roomId:
                            currentRoom.roomId,

                        sessionId:
                            currentRoom.sessionId,

                        code,
                    }
                );


                const activeRoom =
                    useMultiplayerStore
                        .getState()
                        .room;


                /*
                 * Chỉ xử lý nếu đây vẫn là
                 * room hiện tại.
                 *
                 * Nếu room cũ leave sau khi
                 * room mới đã được set thì
                 * KHÔNG được đụng vào room mới.
                 */

                if (
                    activeRoom !==
                    currentRoom
                ) {

                    console.log(
                        "[GAME PAGE] Ignoring old room leave"
                    );


                    return;

                }


                useMultiplayerStore
                    .getState()
                    .clearRoom();


                router.replace(
                    "/multiplayer"
                );

            }
        );

    }, [
        room,
        router,
    ]);


    // ========================================================
    // ORIENTATION
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

    if (!room) {

        return (
            <div className="game-loading">
                Đang quay về phòng...
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

                <div className="landscape-phone">
                    📱
                </div>

                <div className="landscape-arrow">
                    ↔️
                </div>

                <div className="landscape-title">
                    XOAY NGANG ĐIỆN THOẠI
                </div>

                <div className="landscape-description">
                    Vui lòng xoay điện thoại sang
                    chế độ ngang để chơi game.
                </div>

                <div className="landscape-hint">
                    Game yêu cầu màn hình ngang
                </div>

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
