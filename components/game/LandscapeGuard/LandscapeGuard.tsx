
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

export default function LandscapeGuard({
    children,
}: Props) {
    const [isPortrait, setIsPortrait] = useState(true);

    useEffect(() => {
        function checkOrientation() {
            setIsPortrait(
                window.innerHeight > window.innerWidth
            );
        }

        checkOrientation();

        window.addEventListener("resize", checkOrientation);
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
                        Boom chỉ có thể chơi ở chế độ màn hình ngang.
                        Hãy xoay điện thoại sang ngang để tham gia
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
