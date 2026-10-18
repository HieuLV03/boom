
"use client";

import { Suspense } from "react";
import HospitalModel from "./HospitalModel";

export default function ZombieHouse() {
    return (
        <group>
            <Suspense fallback={null}>
                <HospitalModel />
            </Suspense>
        </group>
    );
}
