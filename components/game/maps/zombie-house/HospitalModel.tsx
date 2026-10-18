
"use client";

import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

const MODEL_PATH = "/models/houses/test/test.glb";

export default function HospitalModel() {
    const { scene } = useGLTF(MODEL_PATH);

    const model = useMemo(() => scene.clone(true), [scene]);

    useEffect(() => {
        model.traverse((object) => {
            if (!(object instanceof THREE.Mesh)) return;

            object.castShadow = true;
            object.receiveShadow = true;
        });

        model.updateMatrixWorld(true);

        // Đo kích thước model sau khi tải.
        const bounds = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();

        bounds.getSize(size);
        bounds.getCenter(center);

        console.log("[HospitalModel] Size:", size);
        console.log("[HospitalModel] Center:", center);
        console.log("[HospitalModel] Bounds:", bounds);
    }, [model]);

    return (
        <primitive
            object={model}
            position={[0, 0, 0]}
            scale={1}
        />
    );
}

useGLTF.preload(MODEL_PATH);
