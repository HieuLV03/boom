
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
    running?: boolean;
    crouching?: boolean;
    jumpTrigger?: number;
    weaponType?: string;
};
// ============================================================
// PLAYER
// ============================================================

export default function Player({
    position = [0, 0, 0],
    rotation = 0,
    appearance = DEFAULT_APPEARANCE,
    moving = false,
    weaponType = "",
}: Props) {
    const running = useRunStore(
        (state) => state.running,
    );

    const punchTrigger = usePunchStore(
        (state) => state.punchTrigger,
    );

    const crouching = useCrouchStore(
        (state) => state.crouching,
    );

    const jumpTrigger = useJumpStore(
        (state) => state.jumpTrigger,
    );
    return (
        <group position={position}>
            {/* CHARACTER + HELD WEAPON */}
            <group
                position={[0, 0, 0]}
                rotation={[0, rotation, 0]}
            >
                <Character3D
                    moving={moving}
                    running={running && !crouching}
                    crouching={crouching}
                    jumpTrigger={jumpTrigger}
                    punchTrigger={punchTrigger}
                    weaponType={weaponType}
                />
            </group>

       
        </group>
    );
}
