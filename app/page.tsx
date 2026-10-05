"use client";

import { useRouter } from "next/navigation";

export default function HomePage() {
const router = useRouter();


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

                <p>
                    Bước vào chiến trường.
                    <br />
                    Sống sót là mục tiêu duy nhất.
                </p>

                <div className="actions">
                    <button
                        className="primaryButton"
                        onClick={() => router.push("/game")}
                    >
                        <span className="buttonIcon">▶</span>
                        CHƠI NGAY
                    </button>

                    <button
                        className="secondaryButton"
                        onClick={() =>
                            router.push("/multiplayer")
                        }
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

            <div className="version">
                BOOM WEB · v0.1.0
            </div>
        </footer>

        <style jsx>{`
            * {
                box-sizing: border-box;
            }

            .home {
                position: relative;
                min-height: 100svh;
                overflow: hidden;
                background:
                    radial-gradient(
                        circle at 65% 45%,
                        #263b51 0%,
                        #101923 42%,
                        #060a0f 100%
                    );
                color: #fff;
                font-family:
                    Arial,
                    Helvetica,
                    sans-serif;
            }

            .background {
                position: absolute;
                inset: 0;
                overflow: hidden;
                pointer-events: none;
            }

            .glow {
                position: absolute;
                width: 420px;
                height: 420px;
                border-radius: 50%;
                filter: blur(100px);
                opacity: 0.16;
            }

            .glowOne {
                top: 15%;
                right: 10%;
                background: #ff6b00;
            }

            .glowTwo {
                bottom: 0;
                left: 5%;
                background: #2563eb;
            }

            .grid {
                position: absolute;
                left: -20%;
                right: -20%;
                bottom: -25%;
                height: 60%;
                opacity: 0.12;
                transform: perspective(500px)
                    rotateX(65deg);
                background-image:
                    linear-gradient(
                        rgba(255, 255, 255, 0.3)
                            1px,
                        transparent 1px
                    ),
                    linear-gradient(
                        90deg,
                        rgba(255, 255, 255, 0.3)
                            1px,
                        transparent 1px
                    );
                background-size: 50px 50px;
            }

            .mountain {
                position: absolute;
                bottom: 0;
                width: 0;
                height: 0;
                border-left: 220px solid transparent;
                border-right: 220px solid transparent;
                border-bottom: 330px solid
                    rgba(10, 18, 26, 0.8);
            }

            .mountainOne {
                left: 5%;
            }

            .mountainTwo {
                right: 8%;
                transform: scale(1.4);
                opacity: 0.6;
            }

            .header {
                position: relative;
                z-index: 5;
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 28px 42px;
            }

            .logo {
                display: flex;
                flex-direction: column;
                line-height: 0.8;
            }

            .logo span {
                font-size: 38px;
                font-weight: 1000;
                font-style: italic;
                letter-spacing: -3px;
                text-shadow:
                    3px 3px 0 #000,
                    0 0 30px rgba(255, 255, 255, 0.15);
            }

            .logo small {
                margin-top: 8px;
                color: #9ca3af;
                font-size: 8px;
                font-weight: 800;
                letter-spacing: 4px;
            }

            .online {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 13px;
                border: 1px solid
                    rgba(255, 255, 255, 0.12);
                border-radius: 30px;
                background: rgba(0, 0, 0, 0.25);
                color: #9ca3af;
                font-size: 10px;
                font-weight: 800;
                letter-spacing: 1px;
            }

            .onlineDot {
                width: 7px;
                height: 7px;
                border-radius: 50%;
                background: #22c55e;
                box-shadow:
                    0 0 10px #22c55e;
            }

            .hero {
                position: relative;
                z-index: 2;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: calc(100svh - 160px);
                padding: 20px 7vw 100px;
            }

            .heroContent {
                position: relative;
                z-index: 3;
                width: 50%;
                max-width: 620px;
            }

            .eyebrow {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 22px;
                color: #f97316;
                font-size: 11px;
                font-weight: 900;
                letter-spacing: 4px;
            }

            .eyebrow span {
                width: 28px;
                height: 2px;
                background: #f97316;
            }

            h1 {
                margin: 0;
                font-size: clamp(64px, 8vw, 125px);
                font-weight: 1000;
                font-style: italic;
                line-height: 0.82;
                letter-spacing: -7px;
                text-shadow:
                    5px 5px 0 rgba(0, 0, 0, 0.7);
            }

            h1 strong {
                color: #f97316;
                text-shadow:
                    5px 5px 0 #7c2d12,
                    0 0 35px rgba(249, 115, 22, 0.2);
            }

            .heroContent p {
                margin: 28px 0 30px;
                color: #aeb8c4;
                font-size: 15px;
                line-height: 1.7;
            }

            .actions {
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
            }

            button {
                border: 0;
                cursor: pointer;
                color: #fff;
                font-weight: 900;
                letter-spacing: 0.5px;
                transition:
                    transform 0.2s,
                    filter 0.2s;
            }

            button:hover {
                transform: translateY(-2px);
                filter: brightness(1.1);
            }

            button:active {
                transform: scale(0.97);
            }

            .primaryButton {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 17px 27px;
                border-radius: 10px;
                background: #f97316;
                box-shadow:
                    0 12px 30px
                        rgba(249, 115, 22, 0.22);
                font-size: 14px;
            }

            .buttonIcon {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                background: rgba(0, 0, 0, 0.2);
                font-size: 11px;
            }

            .secondaryButton {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 17px 22px;
                border: 1px solid
                    rgba(255, 255, 255, 0.15);
                border-radius: 10px;
                background: rgba(255, 255, 255, 0.06);
                font-size: 13px;
            }

            .character {
                position: relative;
                width: 50%;
                height: 540px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .characterGlow {
                position: absolute;
                width: 360px;
                height: 360px;
                border-radius: 50%;
                background: rgba(249, 115, 22, 0.13);
                filter: blur(60px);
            }

            .characterBody {
                position: relative;
                width: 180px;
                height: 390px;
                filter: drop-shadow(
                    30px 30px 25px
                        rgba(0, 0, 0, 0.6)
                );
                transform: rotate(-4deg);
            }

            .head {
                position: absolute;
                left: 55px;
                top: 15px;
                width: 72px;
                height: 82px;
                border-radius: 45% 45% 42% 42%;
                background:
                    linear-gradient(
                        135deg,
                        #d99b73,
                        #8b543b
                    );
            }

            .head::before {
                content: "";
                position: absolute;
                left: -5px;
                top: -9px;
                width: 82px;
                height: 40px;
                border-radius: 50% 50% 30% 30%;
                background: #18232e;
            }

            .body {
                position: absolute;
                left: 38px;
                top: 91px;
                width: 105px;
                height: 155px;
                border-radius: 25px 25px 15px 15px;
                background:
                    linear-gradient(
                        135deg,
                        #33495c,
                        #101820
                    );
            }

            .body::after {
                content: "";
                position: absolute;
                left: 18px;
                top: 30px;
                width: 68px;
                height: 65px;
                border-radius: 8px;
                border: 2px solid
                    rgba(255, 255, 255, 0.12);
            }

            .arm {
                position: absolute;
                top: 105px;
                width: 31px;
                height: 145px;
                border-radius: 20px;
                background: #263747;
            }

            .armLeft {
                left: 15px;
                transform: rotate(18deg);
            }

            .armRight {
                right: 7px;
                transform: rotate(-18deg);
            }

            .gun {
                position: absolute;
                z-index: 3;
                top: 151px;
                left: 91px;
                width: 130px;
                height: 20px;
                border-radius: 5px;
                background: #151b21;
                transform: rotate(-13deg);
                box-shadow:
                    0 0 0 3px rgba(255, 255, 255, 0.04);
            }

            .gun::after {
                content: "";
                position: absolute;
                left: 102px;
                top: 7px;
                width: 70px;
                height: 5px;
                background: #080b0e;
            }

            .leg {
                position: absolute;
                top: 225px;
                width: 40px;
                height: 155px;
                border-radius: 20px;
                background: #151f29;
            }

            .legLeft {
                left: 44px;
                transform: rotate(5deg);
            }

            .legRight {
                left: 93px;
                transform: rotate(-10deg);
            }

            .characterLabel {
                position: absolute;
                right: 10%;
                bottom: 12%;
                display: flex;
                flex-direction: column;
                gap: 4px;
                color: #718096;
                font-size: 9px;
                font-weight: 800;
                letter-spacing: 3px;
            }

            .characterLabel span {
                color: #f97316;
                font-size: 12px;
            }

            .footer {
                position: absolute;
                z-index: 5;
                left: 42px;
                right: 42px;
                bottom: 25px;
                display: flex;
                align-items: flex-end;
                justify-content: space-between;
            }

            .stats {
                display: flex;
                gap: 45px;
            }

            .stats div {
                display: flex;
                flex-direction: column;
            }

            .stats strong {
                font-size: 18px;
                font-weight: 900;
            }

            .stats span {
                margin-top: 3px;
                color: #687584;
                font-size: 8px;
                font-weight: 800;
                letter-spacing: 1px;
            }

            .version {
                color: #4b5563;
                font-size: 9px;
                letter-spacing: 1px;
            }

            @media (max-width: 800px) {
                .header {
                    padding: 20px;
                }

                .logo span {
                    font-size: 30px;
                }

                .hero {
                    min-height: calc(100svh - 100px);
                    align-items: flex-start;
                    padding: 7vh 24px 120px;
                }

                .heroContent {
                    width: 100%;
                    max-width: none;
                }

                .eyebrow {
                    font-size: 8px;
                    letter-spacing: 2px;
                }

                h1 {
                    font-size: clamp(
                        58px,
                        17vw,
                        92px
                    );
                    letter-spacing: -5px;
                }

                .heroContent p {
                    margin: 20px 0 25px;
                    font-size: 13px;
                }

                .actions {
                    position: relative;
                    z-index: 10;
                    flex-direction: column;
                    width: 100%;
                }

                .primaryButton,
                .secondaryButton {
                    justify-content: center;
                    width: 100%;
                    padding: 16px;
                }

                .character {
                    position: absolute;
                    right: -40px;
                    bottom: 100px;
                    width: 240px;
                    height: 420px;
                    opacity: 0.5;
                    transform: scale(0.8);
                }

                .characterLabel {
                    display: none;
                }

                .footer {
                    left: 20px;
                    right: 20px;
                    bottom: 18px;
                }

                .stats {
                    gap: 18px;
                }

                .stats strong {
                    font-size: 14px;
                }

                .stats span {
                    font-size: 7px;
                }

                .version {
                    display: none;
                }
            }

            @media (max-width: 400px) {
                .hero {
                    padding-left: 18px;
                    padding-right: 18px;
                }

                h1 {
                    font-size: 54px;
                }

                .character {
                    right: -80px;
                    opacity: 0.35;
                }
            }
        `}</style>
    </main>
);


}
