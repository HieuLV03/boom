
"use client";

import type { PlayerAppearance } from "./types";

import { useRunStore } from "@/stores/run.store";
import { usePunchStore } from "@/stores/punch.store";
import { useCrouchStore } from "@/stores/crouch.store";
import { useJumpStore } from "@/stores/jump.store";

import Character3D from "./Character3D";
import { DEFAULT_APPEARANCE } from "./player.config";
import { Text } from "@react-three/drei";

// ============================================================
// TYPES
// ============================================================
type Props = {
    position?: [number, number, number];
    rotation?: number;
    appearance?: PlayerAppearance;
    moving?: boolean;
    movingBackward?: boolean;
    aiming?: boolean;
    running?: boolean;
    crouching?: boolean;
    jumpTrigger?: number;
    weaponType?: string;
    punchTrigger?: number; // Thêm dòng này
};

// ============================================================
// PLAYER
// ============================================================
export default function Player({
    position = [0, 0, 0],
    rotation = 0,
    appearance = DEFAULT_APPEARANCE,
    moving = false,
    movingBackward = false,
    running = false,
    crouching = false,
    jumpTrigger = 0,
    weaponType = "",
    aiming = false,
    punchTrigger: remotePunchTrigger,
}: Props) {
    const localPunchTrigger = usePunchStore(
        (state) => state.punchTrigger,
    );

    const punchTrigger =
        remotePunchTrigger ?? localPunchTrigger;

    return (
        <group position={position}>
            <group rotation={[0, rotation, 0]}>
                <Character3D
                    moving={moving}
                    movingBackward={movingBackward}
                    running={running && !crouching}
                    crouching={crouching}
                    aiming={aiming}
                    jumpTrigger={jumpTrigger}
                    punchTrigger={punchTrigger}
                    weaponType={weaponType}
                />
            </group>
        </group>
    );
}