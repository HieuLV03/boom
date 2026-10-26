
"use client";

type Props = {
    position: [
        number,
        number,
        number,
    ];

    scale?: number;
};

export default function Rock({
    position,
    scale = 1,
}: Props) {
    return (
        <mesh
            position={position}
            scale={scale}
            castShadow
            receiveShadow
        >
            <icosahedronGeometry
                args={[
                    0.8,
                    1,
                ]}
            />

            <meshStandardMaterial
                color="#6b7280"
            />
        </mesh>
    );
}
