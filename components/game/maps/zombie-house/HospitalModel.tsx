"use client";

import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

const MODEL_PATH = "/models/houses/test/test.glb";

export default function HospitalModel() {
    const { scene } = useGLTF(MODEL_PATH);

    const model = useMemo(() => {
        const clone = scene.clone(true);

        // Đánh dấu model để LocalPlayerController tìm thấy.
        clone.userData.isHospitalModel = true;

        return clone;
    }, [scene]);

    useEffect(() => {
        model.traverse((object) => {
            if (!(object instanceof THREE.Mesh)) return;

            object.castShadow = true;
            object.receiveShadow = true;
        });

        model.updateMatrixWorld(true);

        const bounds = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();

        bounds.getSize(size);
        bounds.getCenter(center);

        console.log("[HospitalModel] Loaded:", MODEL_PATH);
        console.log("[HospitalModel] Size:", size);
        console.log("[HospitalModel] Center:", center);
        console.log(
            "[HospitalModel] Collision marker:",
            model.userData.isHospitalModel,
        );
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