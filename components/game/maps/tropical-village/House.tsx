
"use client";

type Props = {
    position: [
        number,
        number,
        number,
    ];
};

export default function House({
    position,
}: Props) {
    return (
        <group
            position={position}
        >

            {/* ======================================== */}
            {/* HOUSE BODY */}
            {/* ======================================== */}

            <mesh
                position={[
                    0,
                    1.5,
                    0,
                ]}
                castShadow
                receiveShadow
            >
                <boxGeometry
                    args={[
                        4,
                        3,
                        4,
                    ]}
                />

                <meshStandardMaterial
                    color="#f4d6a0"
                />
            </mesh>


            {/* ======================================== */}
            {/* ROOF */}
            {/* ======================================== */}

            <mesh
                position={[
                    0,
                    3.6,
                    0,
                ]}
                rotation={[
                    0,
                    Math.PI / 4,
                    0,
                ]}
                castShadow
            >
                <coneGeometry
                    args={[
                        3.2,
                        1.6,
                        4,
                    ]}
                />

                <meshStandardMaterial
                    color="#d96b4c"
                />
            </mesh>

        </group>
    );
}
