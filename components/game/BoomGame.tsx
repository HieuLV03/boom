
"use client";

import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";

import GameWorld from "./GameWorld";
import GameHUD from "./GameHUD";
import VirtualJoystick from "./VirtualJoystick";
import TouchCamera from "./TouchCamera";

import {
    useBombStore,
} from "./bomb/bomb.store";

type Props = {
    roomCode?: string;
};

export default function BoomGame({
    roomCode = "",
}: Props) {

    // ==================================================
    // BOMB
    // ==================================================

    const requestBomb =
        useBombStore(
            (state) =>
                state.requestBomb
        );


    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                overflow: "hidden",
                background: "#87ceeb",
            }}
        >

            {/* ==================================================
                3D GAME
            ================================================== */}

            <Canvas
                shadows
                dpr={[1, 1.5]}
                gl={{
                    antialias: false,
                }}
            >

                <PerspectiveCamera
                    makeDefault
                    position={[
                        0,
                        4,
                        7,
                    ]}
                    fov={60}
                />


                <ambientLight
                    intensity={1.5}
                />


                <directionalLight
                    position={[
                        10,
                        20,
                        10,
                    ]}
                    intensity={2}
                    castShadow
                />


                <hemisphereLight
                    intensity={1}
                    color="#87ceeb"
                    groundColor="#4d7c0f"
                />


                <GameWorld />

            </Canvas>


            {/* ==================================================
                ROOM CODE
            ================================================== */}

            {roomCode && (
                <div
                    style={{
                        position: "absolute",

                        top: 16,
                        left: "50%",

                        transform:
                            "translateX(-50%)",

                        padding:
                            "8px 16px",

                        background:
                            "rgba(0, 0, 0, 0.65)",

                        backdropFilter:
                            "blur(8px)",

                        border:
                            "1px solid rgba(255,255,255,.2)",

                        borderRadius: 12,

                        color: "#fff",

                        fontSize: 14,

                        fontWeight: 600,

                        zIndex: 20,

                        pointerEvents:
                            "none",

                        textAlign:
                            "center",
                    }}
                >

                    Mã phòng:{" "}

                    <span
                        style={{
                            marginLeft: 6,

                            fontSize: 18,

                            letterSpacing: 3,

                            fontWeight: 800,
                        }}
                    >
                        {roomCode}
                    </span>

                </div>
            )}


            {/* ==================================================
                HUD
            ================================================== */}

            <GameHUD />


            {/* ==================================================
                LEFT JOYSTICK
            ================================================== */}

            <VirtualJoystick />


            {/* ==================================================
                RIGHT CAMERA
            ================================================== */}

            <TouchCamera />


            {/* ==================================================
                ACTION BUTTONS
            ================================================== */}

            <div
                style={{
                    position: "absolute",

                    right: 24,
                    bottom: 80,

                    display: "flex",

                    flexDirection:
                        "column",

                    gap: 14,

                    pointerEvents:
                        "auto",

                    zIndex: 10,
                }}
            >

                {/* ==================================================
                    PLACE BOMB
                ================================================== */}

                <button
                    type="button"
                    onPointerDown={(
                        event
                    ) => {

                        event.stopPropagation();

                        requestBomb();
                    }}
                    style={{
                        width: 64,
                        height: 64,

                        borderRadius:
                            "50%",

                        border:
                            "2px solid rgba(255,255,255,.25)",

                        background:
                            "rgba(0,0,0,.55)",

                        color: "#fff",

                        fontSize: 30,

                        display:
                            "flex",

                        alignItems:
                            "center",

                        justifyContent:
                            "center",

                        touchAction:
                            "manipulation",

                        userSelect:
                            "none",

                        WebkitTapHighlightColor:
                            "transparent",
                    }}
                >
                    💣
                </button>


                {/* ==================================================
                    JUMP
                ================================================== */}

                <button
                    type="button"
                    style={{
                        width: 64,
                        height: 64,

                        borderRadius:
                            "50%",

                        border:
                            "2px solid rgba(255,255,255,.25)",

                        background:
                            "rgba(0,0,0,.55)",

                        color: "#fff",

                        fontSize: 28,

                        display:
                            "flex",

                        alignItems:
                            "center",

                        justifyContent:
                            "center",
                    }}
                >
                    🦘
                </button>

            </div>

        </div>
    );
}
