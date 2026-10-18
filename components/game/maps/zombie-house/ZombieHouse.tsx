
"use client";

import { Suspense } from "react";
import HospitalModel from "./HospitalModel";

export default function ZombieHouse() {
    return (
        <group name="hospital-map">
            <Suspense fallback={null}>
                <HospitalModel />
            </Suspense>
        </group>
    );
}
