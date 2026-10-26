"use client";

import { useGLTF } from "@react-three/drei";

const MODEL_PATH = "/models/houses/hospital/hospital.glb";

export default function HospitalModel() {
    const { scene } = useGLTF(MODEL_PATH);

    return (
        <primitive
            object={scene}
            position={[0, 0, 0]}
            scale={1}
        />
    );
}

useGLTF.preload(MODEL_PATH);