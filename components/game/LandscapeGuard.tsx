
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

    const [
        isTrying,
        setIsTrying,
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
    // LOCK LANDSCAPE
    // ========================================================

    const requestLandscape = async () => {

        setIsTrying(true);


        try {

            if (
                screen.orientation &&
                "lock" in screen.orientation
            ) {

                await screen.orientation.lock(
                    "landscape"
                );

            }

        }
        catch {
            // ------------------------------------------------
            // Messenger / Zalo / Safari may block this API.
            // User can still rotate manually.
            // ------------------------------------------------
        }


        // ----------------------------------------------------
        // Check again after browser has had time to rotate.
        // ----------------------------------------------------

        setTimeout(() => {

            const portrait =
                window.innerHeight >
                window.innerWidth;

            setIsPortrait(
                portrait
            );

            setIsTrying(false);

        }, 300);

    };


    // ========================================================
    // LANDSCAPE
    // ========================================================

    if (!isPortrait) {

        return (
            <>
                {children}
            </>
        );

    }


    // ========================================================
    // PORTRAIT
    // ========================================================

    return (
        <div
            onClick={requestLandscape}
            style={{
                position: "fixed",
                inset: 0,

                zIndex: 999999,

                display: "flex",
                alignItems: "center",
                justifyContent: "center",

                padding:
                    "24px",

                background:
                    "#050505",

                color:
                    "#ffffff",

                fontFamily:
                    "Arial, sans-serif",

                textAlign:
                    "center",

                cursor:
                    "pointer",

                userSelect:
                    "none",

                WebkitUserSelect:
                    "none",

                touchAction:
                    "manipulation",
            }}
        >

            <div
                style={{
                    width:
                        "100%",

                    maxWidth:
                        "420px",

                    display:
                        "flex",

                    flexDirection:
                        "column",

                    alignItems:
                        "center",

                    gap:
                        "22px",
                }}
            >

                {/* ==================================================
                    PHONE ICON
                ================================================== */}

                <div
                    style={{
                        fontSize:
                            "72px",

                        lineHeight:
                            1,

                        animation:
                            isTrying
                                ? "none"
                                : "boomRotatePhone 1.8s ease-in-out infinite",
                    }}
                >
                    📱
                </div>


                {/* ==================================================
                    TITLE
                ================================================== */}

                <div>

                    <div
                        style={{
                            fontSize:
                                "26px",

                            fontWeight:
                                700,

                            marginBottom:
                                "10px",
                        }}
                    >
                        Xoay ngang điện thoại
                    </div>


                    <div
                        style={{
                            fontSize:
                                "16px",

                            lineHeight:
                                1.5,

                            color:
                                "#bdbdbd",
                        }}
                    >
                        Boom yêu cầu màn hình ngang
                        để chơi.
                    </div>

                </div>


                {/* ==================================================
                    BUTTON
                ================================================== */}

                <button
                    type="button"
                    onClick={(event) => {

                        event.stopPropagation();

                        requestLandscape();

                    }}
                    disabled={isTrying}
                    style={{
                        minWidth:
                            "220px",

                        minHeight:
                            "52px",

                        padding:
                            "0 24px",

                        border:
                            "none",

                        borderRadius:
                            "14px",

                        background:
                            "#ffffff",

                        color:
                            "#111111",

                        fontSize:
                            "16px",

                        fontWeight:
                            700,

                        cursor:
                            isTrying
                                ? "default"
                                : "pointer",

                        opacity:
                            isTrying
                                ? 0.7
                                : 1,
                    }}
                >

                    {isTrying
                        ? "Đang xoay..."
                        : "Chạm để xoay ngang"}

                </button>


                {/* ==================================================
                    FALLBACK
                ================================================== */}

                <div
                    style={{
                        fontSize:
                            "13px",

                        lineHeight:
                            1.5,

                        color:
                            "#888888",

                        maxWidth:
                            "320px",
                    }}
                >

                    Nếu điện thoại không tự xoay,
                    hãy xoay điện thoại sang ngang
                    rồi tiếp tục.

                </div>

            </div>


            {/* ======================================================
                ANIMATION
            ====================================================== */}

            <style>
                {`
                    @keyframes boomRotatePhone {

                        0% {
                            transform: rotate(0deg);
                        }

                        35% {
                            transform: rotate(0deg);
                        }

                        65% {
                            transform: rotate(90deg);
                        }

                        100% {
                            transform: rotate(90deg);
                        }

                    }

                    @media (prefers-reduced-motion: reduce) {

                        * {
                            animation: none !important;
                        }

                    }
                `}
            </style>

        </div>
    );
}
