
"use client";

import { useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Fullscreen } from "@boengli/capacitor-fullscreen";

export default function FullscreenButton() {
    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleFullscreen = async () => {
        try {
            // Chỉ dùng chế độ Immersive trên Android native.
            if (Capacitor.getPlatform() !== "android") {
                if (!document.fullscreenElement) {
                    await document.documentElement.requestFullscreen();
                    setIsFullscreen(true);
                } else {
                    await document.exitFullscreen();
                    setIsFullscreen(false);
                }
                return;
            }

            if (isFullscreen) {
                await Fullscreen.deactivateImmersiveMode();
                setIsFullscreen(false);
            } else {
                await Fullscreen.activateImmersiveMode();
                setIsFullscreen(true);
            }
        } catch (error) {
            console.error("Không thể đổi chế độ toàn màn hình:", error);
        }
    };

    return (
        <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={
                isFullscreen
                    ? "Thoát toàn màn hình"
                    : "Bật toàn màn hình"
            }
            title={
                isFullscreen
                    ? "Thoát toàn màn hình"
                    : "Toàn màn hình"
            }
            className="
                fixed right-4 top-4 z-[1000]
                flex h-11 w-11 items-center justify-center
                rounded-full border border-white/20
                bg-black/60 text-white text-2xl
                backdrop-blur-sm
                active:scale-95
            "
        >
            {isFullscreen ? "⛶" : "⛶"}
        </button>
    );
}
