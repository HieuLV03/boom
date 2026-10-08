
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
// ORIENTATION
// ============================================================

type OrientationWithLock =
    ScreenOrientation & {
        lock?: (
            orientation: string
        ) => Promise<void>;
    };


// ============================================================
// LANDSCAPE GUARD
//
// PORTRAIT:
//
// Phone stays physically vertical.
//
// The GAME is rotated 90 degrees:
//
//       PHONE
//     ┌─────────┐
//     │         │
//     │  GAME → │
//     │         │
//     └─────────┘
//
// FULLSCREEN:
//
// User taps fullscreen button:
//
// requestFullscreen()
//        ↓
// orientation.lock("landscape")
//
// If Chrome allows it, browser UI can disappear
// and the physical screen can become landscape.
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
    // CHECK SCREEN ORIENTATION
    // ========================================================

    useEffect(() => {

        const updateOrientation =
            () => {

                const width =
                    window.innerWidth;

                const height =
                    window.innerHeight;

                setIsPortrait(
                    height > width
                );

            };


        updateOrientation();


        window.addEventListener(
            "resize",
            updateOrientation,
        );

        window.addEventListener(
            "orientationchange",
            updateOrientation,
        );


        return () => {

            window.removeEventListener(
                "resize",
                updateOrientation,
            );

            window.removeEventListener(
                "orientationchange",
                updateOrientation,
            );

        };

    }, []);


    // ========================================================
    // FULLSCREEN
    // ========================================================

    useEffect(() => {

        if (
            typeof document ===
            "undefined"
        ) {
            return;
        }


        /*
         * fullscreenEnabled is more reliable than
         * checking only requestFullscreen.
         */

        const supported =
            document.fullscreenEnabled === true &&
            typeof document
                .documentElement
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
    // ENTER FULLSCREEN
    // ========================================================

    const enterFullscreen =
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
                !document.fullscreenEnabled
            ) {

                return;

            }


            const request =
                document
                    .documentElement
                    .requestFullscreen;


            if (
                typeof request !==
                "function"
            ) {

                return;

            }


            setIsFullscreenTrying(
                true
            );


            try {

                // ============================================
                // ENTER FULLSCREEN
                // ============================================

                await request.call(
                    document.documentElement
                );


                // ============================================
                // TRY REAL LANDSCAPE LOCK
                // ============================================

                try {

                    const orientation =
                        screen.orientation as
                        OrientationWithLock;


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
                    /*
                     * Orientation lock is optional.
                     *
                     * Fullscreen can still work even
                     * when orientation lock fails.
                     */
                }

            }
            catch {
                /*
                 * Chrome / WebView rejected fullscreen.
                 *
                 * This is normal for:
                 *
                 * - Messenger WebView
                 * - Zalo WebView
                 * - unsupported browser
                 * - fullscreen blocked
                 */
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

                await document
                    .exitFullscreen();

            }
            catch {
                // Ignore browser error.
            }

        };


    // ========================================================
    // FULLSCREEN CLICK
    // ========================================================

    const handleFullscreen =
        async () => {

            if (
                isFullscreen
            ) {

                await exitFullscreen();

                return;

            }


            await enterFullscreen();

        };


    // ========================================================
    // FULLSCREEN BUTTON
    // ========================================================

    const FullscreenButton =
        () => {

            if (
                !fullscreenSupported
            ) {

                return null;

            }


            return (
                <button
                    type="button"
                    className="
                        boom-fullscreen-button
                    "
                    onClick={
                        handleFullscreen
                    }
                    disabled={
                        isFullscreenTrying
                    }
                    aria-label={
                        isFullscreen
                            ? "Thoát toàn màn hình"
                            : "Toàn màn hình"
                    }
                >

                    <span
                        className="
                            boom-fullscreen-icon
                        "
                    >
                        ⛶
                    </span>

                    <span>
                        {isFullscreen
                            ? "Thoát"
                            : isFullscreenTrying
                                ? "Đang mở..."
                                : "Toàn màn hình"}
                    </span>

                </button>
            );

        };


    // ========================================================
    // LANDSCAPE
    // ========================================================

    if (!isPortrait) {

        return (
            <div
                className="
                    boom-screen
                    boom-screen-landscape
                "
            >

                <div
                    className="
                        boom-game
                    "
                >
                    {children}
                </div>


                <div
                    className="
                        boom-ui-layer
                    "
                >
                    <FullscreenButton />
                </div>


                <style jsx>{`

                    .boom-screen {
                        position: fixed;

                        inset: 0;

                        width: 100vw;

                        height: 100dvh;

                        overflow: hidden;

                        background: #000000;

                        touch-action: none;
                    }


                    .boom-game {
                        position: absolute;

                        inset: 0;

                        width: 100%;

                        height: 100%;

                        overflow: hidden;

                        touch-action: none;
                    }


                    .boom-ui-layer {
                        position: absolute;

                        inset: 0;

                        z-index: 2147483647;

                        pointer-events: none;

                        touch-action: none;
                    }


                    .boom-fullscreen-button {
                        position: absolute;

                        top:
                            calc(
                                12px +
                                env(
                                    safe-area-inset-top,
                                    0px
                                )
                            );

                        right:
                            calc(
                                12px +
                                env(
                                    safe-area-inset-right,
                                    0px
                                )
                            );

                        min-width: 44px;

                        min-height: 44px;

                        padding:
                            0 14px;

                        border:
                            1px solid
                            rgba(
                                255,
                                255,
                                255,
                                0.25
                            );

                        border-radius: 12px;

                        background:
                            rgba(
                                0,
                                0,
                                0,
                                0.65
                            );

                        color: #ffffff;

                        font-size: 13px;

                        font-weight: 700;

                        display: flex;

                        align-items: center;

                        justify-content: center;

                        gap: 7px;

                        cursor: pointer;

                        pointer-events: auto;

                        user-select: none;

                        -webkit-user-select: none;

                        -webkit-tap-highlight-color:
                            transparent;

                        touch-action: manipulation;
                    }


                    .boom-fullscreen-button:active {
                        transform: scale(0.96);
                    }


                    .boom-fullscreen-button:disabled {
                        opacity: 0.55;

                        cursor: default;
                    }


                    .boom-fullscreen-icon {
                        font-size: 21px;

                        line-height: 1;
                    }

                `}</style>

            </div>
        );

    }


    // ========================================================
    // PORTRAIT
    //
    // Physical phone remains portrait.
    //
    // GAME becomes landscape by rotating
    // the entire game container.
    // ========================================================

    return (
        <div
            className="
                boom-screen
                boom-screen-portrait
            "
        >

            <div
                className="
                    boom-rotated-game
                "
            >

                {children}

            </div>


            <div
                className="
                    boom-ui-layer
                "
            >
                <FullscreenButton />
            </div>


            <style jsx>{`

                .boom-screen {
                    position: fixed;

                    inset: 0;

                    width: 100vw;

                    height: 100dvh;

                    overflow: hidden;

                    background: #000000;

                    touch-action: none;
                }


                /*
                 * PORTRAIT PHONE
                 *
                 * Example:
                 *
                 * screen:
                 *  390 x 844
                 *
                 * game before rotation:
                 *  844 x 390
                 *
                 * after rotate(90deg):
                 *  390 x 844
                 */

                .boom-rotated-game {
                    position: absolute;

                    width: 100dvh;

                    height: 100dvw;

                    left: 50%;

                    top: 50%;

                    transform:
                        translate(
                            -50%,
                            -50%
                        )
                        rotate(90deg);

                    transform-origin:
                        center center;

                    overflow: hidden;

                    touch-action: none;
                }


                /*
                 * R3F CANVAS
                 */

                .boom-rotated-game
                    :global(canvas) {

                    display: block;

                    width:
                        100% !important;

                    height:
                        100% !important;

                    max-width:
                        none !important;

                    max-height:
                        none !important;
                }


                /*
                 * UI ABOVE THE GAME
                 */

                .boom-ui-layer {
                    position: absolute;

                    inset: 0;

                    z-index: 2147483647;

                    pointer-events: none;

                    touch-action: none;
                }


                /*
                 * FULLSCREEN BUTTON
                 *
                 * It is intentionally NOT inside
                 * the rotated game.
                 *
                 * This keeps the button easy to tap
                 * on the physical screen.
                 */

                .boom-fullscreen-button {
                    position: absolute;

                    top:
                        calc(
                            12px +
                            env(
                                safe-area-inset-top,
                                0px
                            )
                        );

                    right:
                        calc(
                            12px +
                            env(
                                safe-area-inset-right,
                                0px
                            )
                        );

                    min-width: 44px;

                    min-height: 44px;

                    padding:
                        0 14px;

                    border:
                        1px solid
                        rgba(
                            255,
                            255,
                            255,
                            0.25
                        );

                    border-radius: 12px;

                    background:
                        rgba(
                            0,
                            0,
                            0,
                            0.65
                        );

                    color: #ffffff;

                    font-size: 13px;

                    font-weight: 700;

                    display: flex;

                    align-items: center;

                    justify-content: center;

                    gap: 7px;

                    cursor: pointer;

                    pointer-events: auto;

                    user-select: none;

                    -webkit-user-select: none;

                    -webkit-tap-highlight-color:
                        transparent;

                    touch-action: manipulation;
                }


                .boom-fullscreen-button:active {
                    transform: scale(0.96);
                }


                .boom-fullscreen-button:disabled {
                    opacity: 0.55;

                    cursor: default;
                }


                .boom-fullscreen-icon {
                    font-size: 21px;

                    line-height: 1;
                }

            `}</style>

        </div>
    );
}
