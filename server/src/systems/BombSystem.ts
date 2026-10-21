
import {
    BattleState,
    BombState,
} from "../schema/BattleState.js";

interface BombSystemOptions {
    state: BattleState;
    broadcast: (type: string, message: unknown) => void;
    setInterval: (
        callback: () => void,
        ms: number,
    ) => { clear: () => void };
    setTimeout: (
        callback: () => void,
        ms: number,
    ) => unknown;
    respawnPlayer: (sessionId: string) => void;
}

export class BombSystem {
    private readonly state: BattleState;
    private readonly broadcast: (
        type: string,
        message: unknown,
    ) => void;

    private readonly scheduleInterval: (
        callback: () => void,
        ms: number,
    ) => { clear: () => void };

    private readonly scheduleTimeout: (
        callback: () => void,
        ms: number,
    ) => unknown;

    private readonly respawnPlayer: (sessionId: string) => void;

    private readonly delay = 3000;
    private readonly radius = 4;
    private readonly damage = 20;
    private readonly maxHp = 100;

    constructor(options: BombSystemOptions) {
        this.state = options.state;
        this.broadcast = options.broadcast;
        this.scheduleInterval = options.setInterval;
        this.scheduleTimeout = options.setTimeout;
        this.respawnPlayer = options.respawnPlayer;
    }

    plantBomb(sessionId: string): void {
        if (this.state.gameOver) return;

        const player = this.state.players.get(sessionId);

        if (!player || !player.alive) return;

        const bombId = `${sessionId}-${Date.now()}`;
        const bomb = new BombState();

        bomb.id = bombId;
        bomb.ownerId = sessionId;
        bomb.bombType = "normal";

        bomb.x = player.x;
        bomb.y = player.y;
        bomb.z = player.z;

        bomb.radius = this.radius;
        bomb.damage = this.damage;
        bomb.remaining = Math.ceil(this.delay / 1000);
        bomb.exploded = false;
        bomb.explosionType = "circle";

        this.state.bombs.set(bombId, bomb);

        this.broadcast("bombPlanted", {
            id: bomb.id,
            ownerId: bomb.ownerId,
            x: bomb.x,
            y: bomb.y,
            z: bomb.z,
            radius: bomb.radius,
            remaining: bomb.remaining,
        });

        let remaining = Math.ceil(this.delay / 1000);

        const countdown = this.scheduleInterval(() => {
            const currentBomb = this.state.bombs.get(bombId);

            if (!currentBomb) {
                countdown.clear();
                return;
            }

            if (this.state.gameOver) {
                countdown.clear();
                return;
            }

            remaining--;

            currentBomb.remaining = Math.max(0, remaining);

            if (remaining <= 0) {
                countdown.clear();
                this.explodeBomb(bombId);
            }
        }, 1000);
    }

    explodeBomb(bombId: string): void {
        const bomb = this.state.bombs.get(bombId);

        if (!bomb || bomb.exploded) return;

        bomb.exploded = true;
        bomb.remaining = 0;

        this.state.players.forEach((player, sessionId) => {
            if (!player.alive) return;

            const distance = Math.hypot(
                bomb.x - player.x,
                bomb.z - player.z,
            );

            if (distance > bomb.radius) return;

            const oldHp = Number(player.hp ?? this.maxHp);
            const actualDamage = Math.min(oldHp, bomb.damage);

            player.hp = Math.max(0, oldHp - actualDamage);

            if (player.hp <= 0) {
                player.hp = 0;
                player.alive = false;

                this.scheduleTimeout(() => {
                    this.respawnPlayer(sessionId);
                }, 3000);
            }

            this.broadcast("playerDamaged", {
                playerId: sessionId,
                damage: actualDamage,
                hp: player.hp,
                alive: player.alive,
                distance,
                bombId: bomb.id,
            });
        });

        this.broadcast("bombExploded", {
            id: bomb.id,
            ownerId: bomb.ownerId,
            x: bomb.x,
            y: bomb.y,
            z: bomb.z,
            radius: bomb.radius,
            damage: bomb.damage,
        });

        this.scheduleTimeout(() => {
            if (this.state.bombs.has(bombId)) {
                this.state.bombs.delete(bombId);
            }
        }, 500);
    }
}
