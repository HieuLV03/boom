
"use client";

type Props = {
    position: [
        number,
        number,
        number,
    ];
};

export default function Tree({
    position,
}: Props) {
    return (
        <group
            position={position}
        >

            {/* ======================================== */}
            {/* TRUNK */}
            {/* ======================================== */}

            <mesh
                position={[
                    0,
                    1.2,
                    0,
                ]}
                castShadow
                receiveShadow
            >
                <cylinderGeometry
                    args={[
                        0.3,
                        0.4,
                        2.4,
                        8,
                    ]}
                />

                <meshStandardMaterial
                    color="#8b5a2b"
                />
            </mesh>


            {/* ======================================== */}
            {/* LEAVES */}
            {/* ======================================== */}

            <mesh
                position={[
                    0,
                    2.8,
                    0,
                ]}
                castShadow
            >
                <sphereGeometry
                    args={[
                        1.5,
                        12,
                        12,
                    ]}
                />

                <meshStandardMaterial
                    color="#3e8e4b"
                />
            </mesh>

        </group>
    );
}
