
"use client";

import {
    useEffect,
    useState,
    type ReactNode,
} from "react";

import "./LandscapeGuard.css";

type Props = {
    children: ReactNode;
};

type ScreenOrientationWithLock = ScreenOrientation & {
    lock?: (orientation: string) => Promise<void>;
};

export default function LandscapeGuard({
    children,
}: Props) {
    const [isPortrait, setIsPortrait] = useState(true);

    useEffect(() => {
        let mounted = true;

        function checkOrientation() {
            setIsPortrait(
                window.innerHeight > window.innerWidth
            );
        }

        async function requestLandscape() {
            try {
                if (
                    document.fullscreenEnabled &&
                    !document.fullscreenElement
                ) {
                    await document.documentElement.requestFullscreen();
                }
            } catch (error) {
                console.warn(
                    "[LANDSCAPE] Không thể bật toàn màn hình:",
                    error
                );
            }

            try {
                const orientation =
                    screen.orientation as ScreenOrientationWithLock;

                if (typeof orientation.lock === "function") {
                    await orientation.lock("landscape");
                }
            } catch (error) {
                console.warn(
                    "[LANDSCAPE] Không thể khóa màn hình ngang:",
                    error
                );
            }

            if (mounted) {
                checkOrientation();
            }
        }

        checkOrientation();
        void requestLandscape();

        window.addEventListener("resize", checkOrientation);
        window.addEventListener(
            "orientationchange",
            checkOrientation
        );

        return () => {
            mounted = false;

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

    if (isPortrait) {
        return (
            <div
                className="boom-portrait-warning"
                role="status"
            >
                <div className="boom-rotate-content">
                    <div
                        className="boom-rotate-icon"
                        aria-hidden="true"
                    >
                        <svg
                            viewBox="0 0 100 100"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <rect
                                x="30"
                                y="12"
                                width="40"
                                height="68"
                                rx="6"
                                stroke="currentColor"
                                strokeWidth="4"
                            />

                            <path
                                d="M43 70H57"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                            />

                            <path
                                d="M15 37C18 20 33 7 51 7"
                                stroke="#FACC15"
                                strokeWidth="4"
                                strokeLinecap="round"
                            />

                            <path
                                d="M43 1L53 7L45 16"
                                stroke="#FACC15"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>

                    <h2>Hãy xoay ngang màn hình!</h2>

                    <p>
                        Boom chỉ hỗ trợ chơi ở chế độ màn hình ngang.
                        Hãy xoay điện thoại sang ngang để bắt đầu
                        trận chiến nhé!
                    </p>

                    <div className="boom-rotate-hint">
                        <span aria-hidden="true">↔</span>
                        Xoay điện thoại để tiếp tục chơi
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="boom-screen"
            data-orientation="landscape"
        >
            {children}
        </div>
    );
}
