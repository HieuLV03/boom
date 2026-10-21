
import {
    BattleState,
    PlayerState,
} from "../schema/BattleState.js";

import {
    HospitalCollision,
} from "../../../shared/maps/hospital-collision.js";

const MAX_HP = 100;
const RESPAWN_DELAY = 3000;
const MIN_SPAWN_DISTANCE = 4;
const SPAWN_MAX_DROP = 8;

export interface SpawnPosition {
    x: number;
    y: number;
    z: number;
}

interface SpawnPoint {
    name: string;
    position: SpawnPosition;
}

interface SpawnSystemOptions {
    state: BattleState;
    collision: HospitalCollision;
    verticalVelocity: Map<string, number>;
    broadcast: (type: string, message: unknown) => void;
}

export class SpawnSystem {
    private readonly state: BattleState;
    private readonly collision: HospitalCollision;
    private readonly verticalVelocity: Map<string, number>;
    private readonly broadcast: (
        type: string,
        message: unknown,
    ) => void;

    constructor(options: SpawnSystemOptions) {
        this.state = options.state;
        this.collision = options.collision;
        this.verticalVelocity = options.verticalVelocity;
        this.broadcast = options.broadcast;
    }

    /**
     * Chọn một spawn marker có mặt sàn hợp lệ,
     * không bị vật cản và ưu tiên cách xa người chơi khác.
     */
    getRandomSpawnPosition(): SpawnPosition {
const spawnPoints = this.collision.getSpawnPoints();
        if (spawnPoints.length === 0) {
            throw new Error(
                "[SPAWN] Không tìm thấy marker SPAWN_ trong hospital.glb.",
            );
        }

        const validSpawns: Array<{
            name: string;
            x: number;
            y: number;
            z: number;
        }> = [];

        for (const marker of spawnPoints) {
            const position = this.collision.getSpawnGroundPosition(
                marker,
                SPAWN_MAX_DROP,
            );

            if (!position) {
                console.warn(
                    `[SPAWN] Bỏ qua ${marker.name}: không tìm thấy vị trí sàn hợp lệ.`,
                    marker.position,
                );
                continue;
            }

            // getSpawnGroundPosition() đã kiểm tra vị trí spawn.
            // Không thêm cùng một marker hai lần.
            validSpawns.push({
                name: marker.name,
                x: position.x,
                y: position.y,
                z: position.z,
            });
        }

        if (validSpawns.length === 0) {
            throw new Error(
                "[SPAWN] Không có spawn hợp lệ. " +
                "Kiểm tra marker SPAWN_, geometry sàn và HospitalCollision.",
            );
        }

        const safeSpawns = validSpawns.filter((spawn) => {
            for (const player of this.state.players.values()) {
                if (!player.alive) continue;

                const dx = spawn.x - player.x;
                const dz = spawn.z - player.z;

                if (
                    Math.hypot(dx, dz) < MIN_SPAWN_DISTANCE
                ) {
                    return false;
                }
            }

            return true;
        });

        const candidates =
            safeSpawns.length > 0
                ? safeSpawns
                : validSpawns;

        const selected =
            candidates[Math.floor(Math.random() * candidates.length)];

        console.log("[SPAWN] Đã chọn vị trí:", selected);

        return {
            x: selected.x,
            y: selected.y,
            z: selected.z,
        };
    }

    /**
     * Khởi tạo vị trí cho người chơi mới.
     * Caller vẫn chịu trách nhiệm thêm player vào BattleState.
     */
    initializePlayer(
        player: PlayerState,
        sessionId: string,
    ): SpawnPosition {
        const spawn = this.getRandomSpawnPosition();

        this.verticalVelocity.set(sessionId, 0);

        player.x = spawn.x;
        player.y = spawn.y;
        player.z = spawn.z;
        player.rotation = 0;
        player.moving = false;

        player.hp = MAX_HP;
        player.alive = true;

        console.log("[SPAWN] Người chơi xuất hiện:", {
            player: player.name,
            sessionId,
            ...spawn,
        });

        return spawn;
    }

    /**
     * Hồi sinh người chơi sau khi chết.
     */
    respawnPlayer(sessionId: string): void {
        const player = this.state.players.get(sessionId);

        if (!player || this.state.gameOver) {
            return;
        }

        // Đặt lại vận tốc trước khi thay đổi vị trí.
        this.verticalVelocity.set(sessionId, 0);

        const spawn = this.getRandomSpawnPosition();

        player.x = spawn.x;
        player.y = spawn.y;
        player.z = spawn.z;

        player.rotation = 0;
        player.hp = MAX_HP;
        player.alive = true;
        player.moving = false;

        // Gửi sự kiện để client cập nhật vị trí và trạng thái.
        this.broadcast("playerRespawned", {
            playerId: sessionId,
            x: player.x,
            y: player.y,
            z: player.z,
            rotation: player.rotation,
            hp: player.hp,
            alive: player.alive,
        });

        console.log("[RESPAWN] Hoàn tất:", {
            player: player.name,
            sessionId,
            x: player.x,
            y: player.y,
            z: player.z,
        });
    }

    /**
     * Dọn vận tốc khi người chơi rời phòng.
     */
    removePlayer(sessionId: string): void {
        this.verticalVelocity.delete(sessionId);
    }
}
