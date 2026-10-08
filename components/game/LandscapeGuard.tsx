
"use client";

import {
    useEffect,
    useState,
    type ReactNode,
} from "react";


// ============================================================
// TYPES
// ============================================================

type Props = {
    children: ReactNode;
};


// ============================================================
// LANDSCAPE GUARD
//
// - Điện thoại ngang:
//     Game chạy bình thường.
//
// - Điện thoại dọc:
//     Không bắt người dùng xoay điện thoại.
//     Game tự xoay 90 độ.
//
// - Chrome:
//     Có nút fullscreen.
//     Fullscreen chỉ được gọi sau thao tác của người dùng.
//
// ============================================================

export default function LandscapeGuard({
    children,
}: Props) {

    const [
        isPortrait,
        setIsPortrait,
    ] = useState(false);

    const [
        isFullscreen,
        setIsFullscreen,
    ] = useState(false);

    const [
        fullscreenSupported,
        setFullscreenSupported,
    ] = useState(false);

    const [
        isFullscreenTrying,
        setIsFullscreenTrying,
    ] = useState(false);


    // ========================================================
    // CHECK ORIENTATION
    // ========================================================

    useEffect(() => {

        const checkOrientation = () => {

            const portrait =
                window.innerHeight >
                window.innerWidth;

            setIsPortrait(
                portrait
            );

        };

        checkOrientation();

        window.addEventListener(
            "resize",
            checkOrientation,
        );

        window.addEventListener(
            "orientationchange",
            checkOrientation,
        );

        return () => {

            window.removeEventListener(
                "resize",
                checkOrientation,
            );

            window.removeEventListener(
                "orientationchange",
                checkOrientation,
            );

        };

    }, []);


    // ========================================================
    // CHECK FULLSCREEN SUPPORT
    // ========================================================

    useEffect(() => {

        const supported =
            typeof document !== "undefined" &&
            typeof document.documentElement
                .requestFullscreen ===
                "function";

        setFullscreenSupported(
            supported
        );


        const handleFullscreenChange =
            () => {

                setIsFullscreen(
                    Boolean(
                        document.fullscreenElement
                    )
                );

            };


        document.addEventListener(
            "fullscreenchange",
            handleFullscreenChange,
        );


        handleFullscreenChange();


        return () => {

            document.removeEventListener(
                "fullscreenchange",
                handleFullscreenChange,
            );

        };

    }, []);


    // ========================================================
    // REQUEST FULLSCREEN
    //
    // IMPORTANT:
    //
    // This function must be called from a user
    // gesture such as click/tap.
    //
    // Chrome will reject automatic fullscreen
    // without user interaction.
    // ========================================================

    const requestFullscreen =
        async () => {

            if (
                typeof document ===
                "undefined"
            ) {
                return;
            }


            if (
                document.fullscreenElement
            ) {

                return;

            }


            if (
                typeof document
                    .documentElement
                    .requestFullscreen !==
                "function"
            ) {

                return;

            }


            setIsFullscreenTrying(
                true
            );


            try {

                await document
                    .documentElement
                    .requestFullscreen();


                // ============================================
                // TRY LANDSCAPE LOCK
                //
                // This works on supported mobile browsers,
                // especially after entering fullscreen.
                // ============================================

                try {

                    const orientation =
                        screen.orientation as
                        ScreenOrientation & {
                            lock?: (
                                orientation: string
                            ) => Promise<void>;
                        };


                    if (
                        typeof orientation.lock ===
                        "function"
                    ) {

                        await orientation.lock(
                            "landscape"
                        );

                    }

                }
                catch {
                    // Orientation lock is optional.
                }

            }
            catch {
                // Browser / WebView blocked fullscreen.
            }
            finally {

                setIsFullscreenTrying(
                    false
                );

            }

        };


    // ========================================================
    // EXIT FULLSCREEN
    // ========================================================

    const exitFullscreen =
        async () => {

            if (
                typeof document ===
                "undefined"
            ) {
                return;
            }


            if (
                !document.fullscreenElement
            ) {

                return;

            }


            try {

                await document.exitFullscreen();

            }
            catch {
                // Ignore browser errors.
            }

        };


    // ========================================================
    // FULLSCREEN BUTTON
    // ========================================================

    const handleFullscreen =
        async () => {

            if (isFullscreen) {

                await exitFullscreen();

                return;

            }


            await requestFullscreen();

        };


    // ========================================================
    // LANDSCAPE
    //
    // Normal landscape device.
    // ========================================================

    if (!isPortrait) {

        return (
            <div
                className="boom-landscape-root"
            >

                {children}


                {fullscreenSupported && (
                    <button
                        type="button"
                        className="boom-fullscreen-button"
                        onClick={
                            handleFullscreen
                        }
                        disabled={
                            isFullscreenTrying
                        }
                        aria-label={
                            isFullscreen
                                ? "Thoát toàn màn hình"
                                : "Chơi toàn màn hình"
                        }
                    >
                        {isFullscreen
                            ? "⛶"
                            : "⛶"}
                    </button>
                )}


                <style jsx>{`

                    .boom-landscape-root {
                        position: fixed;

                        inset: 0;

                        width: 100vw;
                        height: 100dvh;

                        overflow: hidden;

                        background: #000000;

                        touch-action: none;
                    }


                    .boom-fullscreen-button {
                        position: absolute;

                        top:
                            calc(
                                12px +
                                env(
                                    safe-area-inset-top
                                )
                            );

                        right:
                            calc(
                                12px +
                                env(
                                    safe-area-inset-right
                                )
                            );

                        z-index: 999999;

                        width: 44px;
                        height: 44px;

                        border: none;
                        border-radius: 12px;

                        background:
                            rgba(
                                0,
                                0,
                                0,
                                0.55
                            );

                        color: #ffffff;

                        font-size: 24px;

                        display: flex;
                        align-items: center;
                        justify-content: center;

                        cursor: pointer;

                        -webkit-tap-highlight-color:
                            transparent;

                        touch-action: manipulation;
                    }


                    .boom-fullscreen-button:disabled {
                        opacity: 0.5;

                        cursor: default;
                    }


                    @media (
                        prefers-reduced-motion: reduce
                    ) {

                        .boom-fullscreen-button {
                            transition: none;
                        }

                    }

                `}</style>

            </div>
        );

    }


    // ========================================================
    // PORTRAIT
    //
    // The physical phone stays portrait.
    //
    // The game itself is rotated 90 degrees.
    // ========================================================

    return (
        <div
            className="boom-portrait-root"
        >

            <div
                className="boom-portrait-game"
            >

                {children}

            </div>


            {fullscreenSupported && (
                <button
                    type="button"
                    className="boom-fullscreen-button"
                    onClick={
                        handleFullscreen
                    }
                    disabled={
                        isFullscreenTrying
                    }
                    aria-label={
                        isFullscreen
                            ? "Thoát toàn màn hình"
                            : "Chơi toàn màn hình"
                    }
                >
                    ⛶
                </button>
            )}


            <style jsx>{`

                .boom-portrait-root {
                    position: fixed;

                    inset: 0;

                    width: 100vw;
                    height: 100dvh;

                    overflow: hidden;

                    background: #000000;

                    touch-action: none;

                    display: flex;

                    align-items: center;

                    justify-content: center;
                }


                /*
                 * GAME CONTAINER
                 *
                 * Before rotation:
                 *
                 * width  = screen height
                 * height = screen width
                 *
                 * After rotate(90deg):
                 *
                 * width  = screen width
                 * height = screen height
                 */

                .boom-portrait-game {
                    position: absolute;

                    width: 100dvh;
                    height: 100dvw;

                    left: 50%;
                    top: 50%;

                    transform:
                        translate(-50%, -50%)
                        rotate(90deg);

                    transform-origin:
                        center center;

                    overflow: hidden;

                    touch-action: none;
                }


                /*
                 * FULLSCREEN BUTTON
                 */

                .boom-fullscreen-button {
                    position: absolute;

                    top:
                        calc(
                            12px +
                            env(
                                safe-area-inset-top
                            )
                        );

                    right:
                        calc(
                            12px +
                            env(
                                safe-area-inset-right
                            )
                        );

                    z-index: 999999;

                    width: 44px;
                    height: 44px;

                    border: none;
                    border-radius: 12px;

                    background:
                        rgba(
                            0,
                            0,
                            0,
                            0.55
                        );

                    color: #ffffff;

                    font-size: 24px;

                    display: flex;

                    align-items: center;
                    justify-content: center;

                    cursor: pointer;

                    -webkit-tap-highlight-color:
                        transparent;

                    touch-action: manipulation;
                }


                .boom-fullscreen-button:disabled {
                    opacity: 0.5;

                    cursor: default;
                }


                /*
                 * R3F CANVAS
                 */

                .boom-portrait-game
                    :global(canvas) {

                    display: block;

                    width: 100% !important;
                    height: 100% !important;

                    max-width: none;

                    max-height: none;
                }


                /*
                 * Prevent Next wrapper from
                 * constraining the game.
                 */

                .boom-portrait-game
                    :global(#__next) {

                    width: 100%;

                    height: 100%;

                    max-width: none;
                }


                @media (
                    prefers-reduced-motion: reduce
                ) {

                    .boom-fullscreen-button {
                        transition: none;
                    }

                }

            `}</style>

        </div>
    );
}
