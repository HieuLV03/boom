"use client";

import { useEffect } from "react";
import { useGLTF } from "@react-three/drei";

// ============================================================
// ASSET PATHS
// ============================================================

const GLB_ASSETS = [
    "/assets/zombie/zombie.glb",
];

// ============================================================
// PRELOAD GLB FILES
// ============================================================

// Bắt đầu tải model và cache trước khi cần render chúng.
for (const path of GLB_ASSETS) {
    useGLTF.preload(path);
}

// ============================================================
// MAP DATA
// ============================================================

const MAP_JSON_ASSETS = [
    "/maps/zombie-house.json",
];

// ============================================================
// GAME ASSET PRELOADER
// ============================================================

export default function GameAssetPreloader() {
    useEffect(() => {
        let cancelled = false;

        async function preloadMapData() {
            await Promise.allSettled(
                MAP_JSON_ASSETS.map(async (url) => {
                    try {
                        const response = await fetch(url);

                        if (!response.ok) {
                            throw new Error(
                                `HTTP ${response.status}: ${url}`
                            );
                        }

                        await response.json();

                        if (!cancelled) {
                            console.log(
                                "[ASSET PRELOAD] Map data ready:",
                                url
                            );
                        }
                    } catch (error) {
                        console.warn(
                            "[ASSET PRELOAD] Failed:",
                            url,
                            error
                        );
                    }
                })
            );
        }

        void preloadMapData();

        return () => {
            cancelled = true;
        };
    }, []);

    return null;
}
