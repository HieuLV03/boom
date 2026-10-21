
import {
    BattleState,
} from "../schema/BattleState.js";

import {
    HospitalCollision,
} from "../../../shared/maps/hospital-collision.js";

interface PlayerPhysicsSystemOptions {
    state: BattleState;
    collision: HospitalCollision;
    verticalVelocity: Map<string, number>;
}

export class PlayerPhysicsSystem {
    private readonly state: BattleState;
    private readonly collision: HospitalCollision;
    private readonly verticalVelocity: Map<string, number>;

    private readonly gravity = 18;
    private readonly maxFallSpeed = 30;
    private readonly maxGroundSearchDrop = 12;

    constructor(options: PlayerPhysicsSystemOptions) {
        this.state = options.state;
        this.collision = options.collision;
        this.verticalVelocity = options.verticalVelocity;
    }

    /**
     * Cập nhật vật lý theo delta time tính bằng giây.
     * Ví dụ: update(0.05) tương ứng 20 lần mỗi giây.
     */
    update(dt: number, gameOver: boolean): void {
        if (gameOver || !Number.isFinite(dt) || dt <= 0) {
            return;
        }

        // Tránh bước vật lý quá lớn nếu server bị khựng.
        const step = Math.min(dt, 0.1);

        this.state.players.forEach((player, sessionId) => {
            if (!player.alive) {
                this.verticalVelocity.delete(sessionId);
                return;
            }

            const groundY = this.collision.getGroundY(
                player.x,
                player.z,
                player.y + 0.05,
                this.maxGroundSearchDrop,
            );

            let velocity =
                this.verticalVelocity.get(sessionId) ?? 0;

            if (groundY === null) {
                velocity = Math.max(
                    velocity - this.gravity * step,
                    -this.maxFallSpeed,
                );

                this.verticalVelocity.set(sessionId, velocity);
                player.y += velocity * step;
                return;
            }

            // Đã chạm hoặc đi xuyên xuống mặt sàn.
            if (player.y <= groundY) {
                player.y = groundY;
                this.verticalVelocity.set(sessionId, 0);
                return;
            }

            // Đang ở trên mặt sàn: tiếp tục rơi.
            velocity = Math.max(
                velocity - this.gravity * step,
                -this.maxFallSpeed,
            );

            const nextY = player.y + velocity * step;

            if (nextY <= groundY) {
                player.y = groundY;
                this.verticalVelocity.set(sessionId, 0);
            } else {
                player.y = nextY;
                this.verticalVelocity.set(sessionId, velocity);
            }
        });
    }

    resetVelocity(sessionId: string): void {
        this.verticalVelocity.set(sessionId, 0);
    }

    removePlayer(sessionId: string): void {
        this.verticalVelocity.delete(sessionId);
    }
}
