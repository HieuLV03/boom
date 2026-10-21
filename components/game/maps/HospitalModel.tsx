
"use client";

import { Suspense, useEffect } from "react";
import { useGLTF } from "@react-three/drei";

function HospitalModelContent() {
    const { scene } = useGLTF(
        "/models/houses/hospital/hospital.glb"
    );

    useEffect(() => {
        scene.userData.isHospitalModel = true;

        scene.traverse((object) => {
            object.userData.isHospitalModel = true;
        });

        scene.updateMatrixWorld(true);

        console.log("[HospitalModel] Registered for collision", {
            name: scene.name,
            position: scene.position.toArray(),
            scale: scene.scale.toArray(),
        });

        return () => {
            delete scene.userData.isHospitalModel;

            scene.traverse((object) => {
                delete object.userData.isHospitalModel;
            });
        };
    }, [scene]);

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
