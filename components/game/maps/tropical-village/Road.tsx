
"use client";

export default function Road() {
    return (
        <mesh
            position={[
                0,
                0.01,
                0,
            ]}
            rotation={[
                -Math.PI / 2,
                0,
                0,
            ]}
            receiveShadow
        >
            <planeGeometry
                args={[8, 100]}
            />

            <meshStandardMaterial
                color="#374151"
            />
        </mesh>
    );
}
