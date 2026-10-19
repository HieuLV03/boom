
"use client";

import { useGLTF } from "@react-three/drei";

// ============================================================
// GLB ASSETS
// ============================================================

const GLB_ASSETS = [
    "/assets/zombie/zombie.glb",

    // Bệnh viện GLB.
    // Nếu model thực tế nằm ở đường dẫn khác,
    // hãy cập nhật đúng đường dẫn bên dưới.
    "/models/houses/hospital/hospital.glb",
];

// ============================================================
// PRELOAD GLB FILES
// ============================================================

// Tải trước và cache model trước khi cần render.
for (const path of GLB_ASSETS) {
    useGLTF.preload(path);
}

// ============================================================
// GAME ASSET PRELOADER
// ============================================================

export default function GameAssetPreloader() {
    return null;
}
