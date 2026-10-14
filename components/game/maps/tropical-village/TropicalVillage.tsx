
"use client";

import { Box } from "@react-three/drei";
import { useMemo } from "react";

import tropicalVillageData from "../../../../shared/maps/tropical-village.json";
import { createGridMap } from "../../../../shared/maps/grid-map";

// ============================================================
// MAP CONFIG
// ============================================================

const mapConfig = createGridMap(tropicalVillageData);

const CELL_SIZE = mapConfig.CELL_SIZE;
const MAP_WIDTH = mapConfig.MAP_WIDTH;
const MAP_HEIGHT = mapConfig.MAP_HEIGHT;
const MAZE_MAP = mapConfig.MAZE_MAP;

// ============================================================
// TROPICAL VILLAGE MAP
// ============================================================

export default function TropicalVillage() {
    const walls = useMemo(() => {
        const offsetX = Math.floor(MAP_WIDTH / 2);
        const offsetZ = Math.floor(MAP_HEIGHT / 2);

        const result: {
            x: number;
            z: number;
            key: string;
        }[] = [];

        MAZE_MAP.forEach((row, z) => {
            row.split("").forEach((cell, x) => {
                if (cell !== "#") return;

                result.push({
                    x: (x - offsetX) * CELL_SIZE,
                    z: (z - offsetZ) * CELL_SIZE,
                    key: `${x}-${z}`,
                });
            });
        });

        return result;
    }, []);

    const WALL_HEIGHT = 2;
    const WALL_TOP_HEIGHT = 0.12;

    return (
        <group>
            {/* GROUND */}
            <mesh
                position={[0, -0.08, 0]}
                receiveShadow
            >
                <boxGeometry
                    args={[
                        MAP_WIDTH * CELL_SIZE,
                        0.16,
                        MAP_HEIGHT * CELL_SIZE,
                    ]}
                />

                <meshStandardMaterial color="#6fa34a" />
            </mesh>

            {/* WALLS */}
            {walls.map((wall) => (
                <group
                    key={wall.key}
                    position={[
                        wall.x,
                        WALL_HEIGHT / 2,
                        wall.z,
                    ]}
                >
                    {/* Main wall */}
                    <Box
                        args={[
                            CELL_SIZE,
                            WALL_HEIGHT,
                            CELL_SIZE,
                        ]}
                        castShadow
                        receiveShadow
                    >
                        <meshStandardMaterial color="#7c4a2d" />
                    </Box>

                    {/* Grass top */}
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
                        <meshStandardMaterial color="#4f7d32" />
                    </Box>
                </group>
            ))}
        </group>
    );
}
