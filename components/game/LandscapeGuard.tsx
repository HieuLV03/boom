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
// ============================================================

export default function LandscapeGuard({
    children,
}: Props) {

    const [
        isPortrait,
        setIsPortrait,
    ] = useState(false);


    // ========================================================
    // ORIENTATION
    // ========================================================

    useEffect(() => {

        function checkOrientation() {

            setIsPortrait(
                window.innerHeight >
                window.innerWidth
            );

        }


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
    // PORTRAIT
    // ========================================================

    if (isPortrait) {

        return (

            <div
                className="boom-screen"
                data-orientation="portrait"
            >

                <div
                    className="boom-rotated-game"
                >
                    {children}
                </div>

            </div>

        );

    }


    // ========================================================
    // LANDSCAPE
    // ========================================================

    return (

        <div
            className="boom-screen"
            data-orientation="landscape"
        >

            {children}

        </div>

    );

}