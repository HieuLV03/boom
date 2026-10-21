
import {
    BattleState,
} from "../schema/BattleState.js";

import {
    HospitalCollision,
} from "../../../shared/maps/hospital-collision.js";

interface MovementSystemOptions {
    state: BattleState;
    collision: HospitalCollision;
}

interface MoveMessage {
    x?: number;
    z?: number;
    rotation?: number;
}

export class MovementSystem {
    private readonly state: BattleState;
    private readonly collision: HospitalCollision;

    private readonly maxMovePerMessage = 1.0;
    private readonly maxStep = 0.1;
    private readonly playerRadius = 0.4;
    private readonly playerHeight = 1.8;

    constructor(options: MovementSystemOptions) {
        this.state = options.state;
        this.collision = options.collision;
    }

    handleMove(
        sessionId: string,
        message: MoveMessage,
        gameOver: boolean,
    ): void {
        if (gameOver) return;

        const player = this.state.players.get(sessionId);

        if (!player || !player.alive) return;

        const requestedX =
            typeof message?.x === "number" &&
            Number.isFinite(message.x)
                ? message.x
                : player.x;

        const requestedZ =
            typeof message?.z === "number" &&
            Number.isFinite(message.z)
                ? message.z
                : player.z;

        const requestedRotation =
            typeof message?.rotation === "number" &&
            Number.isFinite(message.rotation)
                ? message.rotation
                : player.rotation;

        let deltaX = requestedX - player.x;
        let deltaZ = requestedZ - player.z;

        // Giới hạn quãng đường trong mỗi message.
        const distance = Math.hypot(deltaX, deltaZ);

        if (distance > this.maxMovePerMessage) {
            const scale = this.maxMovePerMessage / distance;
            deltaX *= scale;
            deltaZ *= scale;
        }

        const startX = player.x;
        const startZ = player.z;

        let finalX = startX;
        let finalZ = startZ;

        const canMoveTo = (x: number, z: number): boolean => {
            return this.collision.canMoveTo(
                x,
                z,
                this.playerRadius,
                player.y,
                this.playerHeight,
            );
        };

        const steps = Math.max(
            1,
            Math.ceil(
                Math.hypot(deltaX, deltaZ) / this.maxStep,
            ),
        );

        const stepX = deltaX / steps;
        const stepZ = deltaZ / steps;

        for (let i = 0; i < steps; i++) {
            // Kiểm tra trục X riêng để có thể trượt dọc tường.
            const nextX = finalX + stepX;

            if (canMoveTo(nextX, finalZ)) {
                finalX = nextX;
            }

            // Kiểm tra trục Z riêng.
            const nextZ = finalZ + stepZ;

            if (canMoveTo(finalX, nextZ)) {
                finalZ = nextZ;
            }
        }

        player.x = finalX;
        player.z = finalZ;
        player.rotation = requestedRotation;

        player.moving =
            Math.abs(finalX - startX) > 0.001 ||
            Math.abs(finalZ - startZ) > 0.001;

        // Y vẫn do PlayerPhysicsSystem quản lý.
        // Không chấp nhận Y tùy ý từ client.
    }
}
