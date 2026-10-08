
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
// Portrait phone:
//
//      ┌──────────────┐
//      │              │
//      │   ┌──────┐   │
//      │   │ GAME │   │
//      │   │      │   │
//      │   └──────┘   │
//      │              │
//      └──────────────┘
//
// Game itself always uses landscape coordinates.
// We rotate the whole game container when the
// physical device is portrait.
// ============================================================

export default function LandscapeGuard({
    children,
}: Props) {

    const [
        isPortrait,
        setIsPortrait,
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
    // LANDSCAPE
    //
    // Normal case.
    // ========================================================

    if (!isPortrait) {

        return (
            <div
                className="boom-landscape-root"
            >
                {children}

                <style jsx>{`

                    .boom-landscape-root {
                        position: fixed;
                        inset: 0;

                        width: 100vw;
                        height: 100vh;

                        overflow: hidden;

                        touch-action: none;
                    }

                `}</style>
            </div>
        );

    }


    // ========================================================
    // PORTRAIT
    //
    // We DO NOT ask the browser to rotate.
    //
    // Instead:
    //
    // physical screen:
    //
    //      width  = small
    //      height = large
    //
    // game:
    //
    //      width  = large
    //      height = small
    //
    // Rotate the game 90 degrees.
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


            <style jsx>{`

                .boom-portrait-root {
                    position: fixed;
                    inset: 0;

                    width: 100vw;
                    height: 100vh;

                    overflow: hidden;

                    background: #000000;

                    touch-action: none;

                    display: flex;
                    align-items: center;
                    justify-content: center;
                }


                /*
                 * The game uses the available
                 * landscape dimensions.
                 *
                 * Before rotation:
                 *
                 * width  = 100vh
                 * height = 100vw
                 *
                 * After rotate(90deg):
                 *
                 * width  = 100vw
                 * height = 100vh
                 */

                .boom-portrait-game {
                    position: absolute;

                    width: 100vh;
                    height: 100vw;

                    left: 50%;
                    top: 50%;

                    transform:
                        translate(-50%, -50%)
                        rotate(90deg);

                    transform-origin: center center;

                    overflow: hidden;

                    touch-action: none;
                }


                /*
                 * Make sure the game itself fills
                 * the rotated container.
                 */

                .boom-portrait-game :global(#__next),
                .boom-portrait-game :global(canvas) {
                    max-width: none;
                }

            `}</style>

        </div>
    );
}
