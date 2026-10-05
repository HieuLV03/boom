
"use client";

import Ground from "./Ground";
import Road from "./Road";
import House from "./House";
import Tree from "./Tree";
import Rock from "./Rock";

export default function TropicalVillage() {
    return (
        <group>

            {/* ================================================== */}
            {/* GROUND */}
            {/* ================================================== */}

            <Ground />


            {/* ================================================== */}
            {/* ROAD */}
            {/* ================================================== */}

            <Road />


            {/* ================================================== */}
            {/* HOUSES */}
            {/* ================================================== */}

            <House
                position={[-12, 0, -12]}
            />

            <House
                position={[12, 0, -18]}
            />

            <House
                position={[-15, 0, 18]}
            />


            {/* ================================================== */}
            {/* TREES */}
            {/* ================================================== */}

            <Tree
                position={[-8, 0, -5]}
            />

            <Tree
                position={[9, 0, -7]}
            />

            <Tree
                position={[15, 0, 3]}
            />

            <Tree
                position={[-12, 0, 8]}
            />

            <Tree
                position={[8, 0, 15]}
            />

            <Tree
                position={[-20, 0, -22]}
            />

            <Tree
                position={[22, 0, -25]}
            />

            <Tree
                position={[-25, 0, 25]}
            />


            {/* ================================================== */}
            {/* ROCKS */}
            {/* ================================================== */}

            <Rock
                position={[-5, 0.5, -15]}
            />

            <Rock
                position={[7, 0.5, 8]}
                scale={1.4}
            />

            <Rock
                position={[-18, 0.5, 5]}
                scale={0.8}
            />

            <Rock
                position={[20, 0.5, 15]}
                scale={1.2}
            />

        </group>
    );
}
