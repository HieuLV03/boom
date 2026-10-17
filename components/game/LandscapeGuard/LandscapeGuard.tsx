
"use client";

import { useEffect, useState, type ReactNode } from "react";
import "./LandscapeGuard.css";

type Props = {
    children: ReactNode;
};

export default function LandscapeGuard({ children }: Props) {
    const [isLandscape, setIsLandscape] = useState<boolean | null>(
        null
    );

    useEffect(() => {
        const mediaQuery = window.matchMedia(
            "(orientation: landscape)"
        );

        function checkOrientation() {
            setIsLandscape(mediaQuery.matches);
        }

        checkOrientation();

        mediaQuery.addEventListener("change", checkOrientation);
        window.addEventListener("resize", checkOrientation);
        window.addEventListener("orientationchange", checkOrientation);

        return () => {
            mediaQuery.removeEventListener("change", checkOrientation);
            window.removeEventListener("resize", checkOrientation);
            window.removeEventListener(
                "orientationchange",
                checkOrientation
            );
        };
    }, []);

    // Chờ xác định hướng màn hình trước khi render game.
    if (isLandscape === null) {
        return <div className="landscape-checking" />;
    }

    // Màn hình dọc: chỉ hiện thông báo, không render game.
    if (!isLandscape) {
        return (
            <div className="portrait-warning">
                <div className="portrait-warning-logo">
                    BOOM
                    <span>BATTLE ROYALE</span>
                </div>

                <div className="portrait-phone">
                    <svg
                        viewBox="0 0 100 100"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
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

                <h1>Hãy xoay ngang màn hình!</h1>

                <p>
                    BOOM được thiết kế để chơi ở chế độ màn hình ngang.
                    Vui lòng xoay điện thoại để tiếp tục.
                </p>

                <div className="portrait-hint">
                    <span>↔</span>
                    Xoay điện thoại để tiếp tục
                </div>
            </div>
        );
    }

    // Màn hình ngang: mới render preloader và game.
    return <div className="boom-screen">{children}</div>;
}
