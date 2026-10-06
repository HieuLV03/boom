
"use client";

import { Box } from "@react-three/drei";

import {
    CELL_SIZE,
    MAP_WIDTH,
    MAP_HEIGHT,
    MAZE_MAP,
} from "./maze.config";


// ============================================================
// TROPICAL VILLAGE / MAZE MAP
// ============================================================

export default function TropicalVillage() {

    // ========================================================
    // MAP OFFSET
    // ========================================================

    const offsetX =
        Math.floor(MAP_WIDTH / 2);

    const offsetZ =
        Math.floor(MAP_HEIGHT / 2);


    // ========================================================
    // WALL SIZE
    // ========================================================

    const WALL_HEIGHT = 2;

    const WALL_TOP_HEIGHT = 0.12;


    // ========================================================
    // RENDER
    // ========================================================

    return (
        <group>

            {/* ==================================================
                GROUND
                ================================================== */}

            <mesh
                position={[
                    0,
                    -0.08,
                    0,
                ]}
                receiveShadow
            >

                <boxGeometry
                    args={[
                        MAP_WIDTH * CELL_SIZE,
                        0.16,
                        MAP_HEIGHT * CELL_SIZE,
                    ]}
                />

                <meshStandardMaterial
                    color="#6fa34a"
                />

            </mesh>


            {/* ==================================================
                MAZE WALLS
                ================================================== */}

            {MAZE_MAP.map(
                (row, z) =>
                    row
                        .split("")
                        .map((cell, x) => {

                            // ------------------------------------
                            // FLOOR / SPAWN
                            // ------------------------------------

                            if (cell !== "#") {
                                return null;
                            }


                            // ------------------------------------
                            // WORLD POSITION
                            // ------------------------------------

                            const worldX =
                                (x - offsetX) *
                                CELL_SIZE;

                            const worldZ =
                                (z - offsetZ) *
                                CELL_SIZE;


                            // ------------------------------------
                            // WALL
                            // ------------------------------------

                            return (
                                <group
                                    key={`${x}-${z}`}
                                    position={[
                                        worldX,
                                        WALL_HEIGHT / 2,
                                        worldZ,
                                    ]}
                                >

                                    {/* =================================
                                        MAIN WALL
                                        ================================= */}

                                    <Box
                                        args={[
                                            CELL_SIZE,
                                            WALL_HEIGHT,
                                            CELL_SIZE,
                                        ]}
                                        castShadow
                                        receiveShadow
                                    >

                                        <meshStandardMaterial
                                            color="#7c4a2d"
                                        />

                                    </Box>


                                    {/* =================================
                                        GRASS TOP
                                        ================================= */}

                                    <Box
                                        position={[
                                            0,
                                            WALL_HEIGHT / 2 +
                                            WALL_TOP_HEIGHT / 2,
                                            0,
                                        ]}
                                        args={[
                                            CELL_SIZE * 0.9,
                                            WALL_TOP_HEIGHT,
                                            CELL_SIZE * 0.9,
                                        ]}
                                        castShadow
                                    >

                                        <meshStandardMaterial
                                            color="#4f7d32"
                                        />

                                    </Box>

                                </group>
                            );
                        })
            )}

        </group>
    );
}
