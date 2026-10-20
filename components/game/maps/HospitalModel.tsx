"use client";

import { Suspense } from "react";
import { useGLTF } from "@react-three/drei";

function HospitalModelContent() {
    const { scene } = useGLTF(
        "/models/houses/hospital/hospital.glb"
    );

    return (
        <primitive
            object={scene}
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
            scale={1}
            dispose={null}
        />
    );
}

export default function HospitalModel() {
    return (
        <Suspense fallback={null}>
            <HospitalModelContent />
        </Suspense>
    );
}

useGLTF.preload("/models/houses/hospital/hospital.glb");