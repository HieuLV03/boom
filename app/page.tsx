"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./page.css";

export default function HomePage() {
    const router = useRouter();
    const [isPortrait, setIsPortrait] = useState<boolean | null>(null);

    useEffect(() => {
        function checkOrientation() {
            setIsPortrait(
                window.matchMedia("(orientation: portrait)").matches
            );
        }

        checkOrientation();

        window.addEventListener("resize", checkOrientation);
        window.addEventListener("orientationchange", checkOrientation);

        return () => {
            window.removeEventListener("resize", checkOrientation);
            window.removeEventListener(
                "orientationchange",
                checkOrientation
            );
        };
    }, []);

    // Chờ xác định hướng màn hình để tránh hiện sai giao diện lúc đầu.
    if (isPortrait === null) {
        return null;
    }

    // Điện thoại đang xoay dọc: chỉ hiện lời nhắc xoay ngang.
    if (isPortrait) {
        return (
            <main className="home-portrait-warning">
                <div className="home-rotate-icon">
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

                <div className="home-warning-brand">
                    BOOM <span>BATTLE ROYALE</span>
                </div>

                <h1>HÃY XOAY NGANG MÀN HÌNH!</h1>

                <p>
                    BOOM được thiết kế để chơi ở chế độ màn hình ngang.
                    Hãy xoay điện thoại sang ngang để tiếp tục chiến đấu!
                </p>

                <div className="home-rotate-hint">
                    <span>↔</span>
                    Xoay điện thoại để tiếp tục
                </div>
            </main>
        );
    }

    // Màn hình ngang hoặc máy tính: hiển thị trang chủ bình thường.
    return (
        <main className="home">
            <div className="background">
                <div className="glow glowOne" />
                <div className="glow glowTwo" />
                <div className="mountain mountainOne" />
                <div className="mountain mountainTwo" />
                <div className="grid" />
            </div>

            <header className="header">
                <div className="logo">
                    <span>BOOM</span>
                    <small>BATTLE ROYALE</small>
                </div>

                <div className="online">
                    <span className="onlineDot" />
                    ONLINE
                </div>
            </header>

            <section className="hero">
                <div className="heroContent">
                    <div className="eyebrow">
                        <span />
                        SURVIVE · FIGHT · WIN
                        <span />
                    </div>

                    <h1>
                        DROP
                        <br />
                        <strong>AND BOOM</strong>
                    </h1>

                    <div className="actions">
                        <button
                            className="secondaryButton"
                            onClick={() => router.push("/multiplayer")}
                        >
                            <span>👥</span>
                            MULTIPLAYER
                        </button>
                    </div>
                </div>

                <div className="character">
                    <div className="characterGlow" />

                    <div className="characterBody">
                        <div className="head" />
                        <div className="body" />
                        <div className="arm armLeft" />
                        <div className="arm armRight" />
                        <div className="gun" />
                        <div className="leg legLeft" />
                        <div className="leg legRight" />
                    </div>

                    <div className="characterLabel">
                        <span>01</span>
                        SURVIVOR
                    </div>
                </div>
            </section>

            <footer className="footer">
                <div className="stats">
                    <div>
                        <strong>10</strong>
                        <span>MAX PLAYERS</span>
                    </div>

                    <div>
                        <strong>01</strong>
                        <span>BATTLEFIELD</span>
                    </div>

                    <div>
                        <strong>∞</strong>
                        <span>FUN</span>
                    </div>
                </div>

                <div className="version">BOOM WEB · v0.1.0</div>
            </footer>
        </main>
    );
}