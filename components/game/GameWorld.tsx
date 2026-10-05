"use client";

import Player from "./Player";

type Position = [number, number, number];

function Tree({
position,
}: {
position: Position;
}) {
return ( <group position={position}>
{/* Trunk */}
<mesh position={[0, 1.2, 0]}>
<cylinderGeometry
args={[0.22, 0.3, 2.4, 8]}
/> <meshStandardMaterial color="#6b4423" /> </mesh>


        {/* Lower leaves */}
        <mesh position={[0, 2.8, 0]}>
            <coneGeometry
                args={[1.1, 2.4, 8]}
            />
            <meshStandardMaterial color="#238636" />
        </mesh>

        {/* Upper leaves */}
        <mesh position={[0, 3.8, 0]}>
            <coneGeometry
                args={[0.8, 1.8, 8]}
            />
            <meshStandardMaterial color="#2ea043" />
        </mesh>
    </group>
);


}

function Rock({
position,
scale = 1,
}: {
position: Position;
scale?: number;
}) {
return ( <mesh
         position={position}
         scale={scale}
         castShadow
         receiveShadow
     >
<dodecahedronGeometry args={[0.8, 0]} /> <meshStandardMaterial color="#6b7280" /> </mesh>
);
}

function House({
position,
}: {
position: Position;
}) {
return ( <group position={position}>
{/* House body */}
<mesh
position={[0, 1.25, 0]}
castShadow
receiveShadow
>
<boxGeometry args={[4, 2.5, 4]} /> <meshStandardMaterial color="#d97706" /> </mesh>


        {/* Roof */}
        <mesh
            position={[0, 3.1, 0]}
            rotation={[0, Math.PI / 4, 0]}
            castShadow
        >
            <boxGeometry args={[4.8, 0.5, 4.8]} />
            <meshStandardMaterial color="#7c2d12" />
        </mesh>

        {/* Door */}
        <mesh
            position={[0, 0.8, 2.03]}
            castShadow
        >
            <boxGeometry
                args={[0.9, 1.6, 0.08]}
            />
            <meshStandardMaterial color="#451a03" />
        </mesh>

        {/* Window left */}
        <mesh
            position={[-1.15, 1.35, 2.03]}
        >
            <boxGeometry
                args={[0.8, 0.7, 0.08]}
            />
            <meshStandardMaterial color="#93c5fd" />
        </mesh>

        {/* Window right */}
        <mesh
            position={[1.15, 1.35, 2.03]}
        >
            <boxGeometry
                args={[0.8, 0.7, 0.08]}
            />
            <meshStandardMaterial color="#93c5fd" />
        </mesh>
    </group>
);


}

function Road() {
return ( <group>
{/* Main road */}
<mesh
position={[0, 0.01, 0]}
rotation={[-Math.PI / 2, 0, 0]}
receiveShadow
>
<planeGeometry args={[8, 100]} /> <meshStandardMaterial color="#374151" /> </mesh>


        {/* Road center markings */}
        {Array.from({ length: 12 }).map(
            (_, index) => (
                <mesh
                    key={`road-line-${index}`}
                    position={[
                        0,
                        0.025,
                        -44 + index * 8,
                    ]}
                    rotation={[
                        -Math.PI / 2,
                        0,
                        0,
                    ]}
                >
                    <planeGeometry
                        args={[0.25, 4]}
                    />
                    <meshStandardMaterial color="#facc15" />
                </mesh>
            )
        )}
    </group>
);


}

export default function GameWorld() {
return ( <group>
{/* Ground */}
<mesh
rotation={[-Math.PI / 2, 0, 0]}
receiveShadow
>
<planeGeometry args={[100, 100]} /> <meshStandardMaterial color="#4d7c0f" /> </mesh>


        {/* Road */}
        <Road />

        {/* Houses */}
        <House position={[-12, 0, -12]} />
        <House position={[12, 0, -18]} />
        <House position={[-15, 0, 18]} />

        {/* Trees */}
        <Tree position={[-8, 0, -5]} />
        <Tree position={[9, 0, -7]} />
        <Tree position={[15, 0, 3]} />
        <Tree position={[-12, 0, 8]} />
        <Tree position={[8, 0, 15]} />
        <Tree position={[-20, 0, -22]} />
        <Tree position={[22, 0, -25]} />
        <Tree position={[-25, 0, 25]} />

        {/* Rocks */}
        <Rock position={[-5, 0.5, -15]} />
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

        {/* Player */}
        <Player position={[0, 0, 5]} />
    </group>
);


}
