
import {
    BattleState,
    WeaponPickupState,
} from "../schema/BattleState.js";

import type { HospitalCollision } from "../../../shared/maps/hospital-collision.js";

const PICKUP_DISTANCE = 2.8;

type WeaponPickupSystemOptions = {
    state: BattleState;
    collision: HospitalCollision;
    broadcast: (type: string, message: unknown) => void;
};

type WeaponSpawn = {
    id: string;
    weaponType: string;
    x: number;
    z: number;
};

export class WeaponPickupSystem {
    private readonly state: BattleState;
    private readonly collision: HospitalCollision;
    private readonly broadcast: WeaponPickupSystemOptions["broadcast"];

    constructor(options: WeaponPickupSystemOptions) {
        this.state = options.state;
        this.collision = options.collision;
        this.broadcast = options.broadcast;
    }

    // ========================================================
    // KHỞI TẠO SÚNG
    // ========================================================


initialize(): void {
    if (this.state.weaponPickups.size > 0) {
        console.log(
            `[WEAPON] Giữ ${this.state.weaponPickups.size} pickup hiện có.`,
        );
        return;
    }

    const markers = this.collision.getSpawnPoints();

    console.log(
        "[WEAPON] Số spawn marker:",
        markers.length,
        markers.map((marker) => ({
            name: marker.name,
            position: marker.position,
        })),
    );

    if (markers.length === 0) {
        console.error(
            "[WEAPON] Không tìm thấy marker SPAWN_ trong hospital.glb.",
        );
        return;
    }

    const weaponTypes = ["rifle", "shotgun", "pistol"];

    // Thử lần lượt nhiều vị trí xung quanh marker.
    // Tọa độ sàn luôn được tìm tại chính vị trí đặt súng.
    const offsets = [
        { x: 2.5, z: 0 },
        { x: 0, z: 2.5 },
        { x: -2.5, z: 0 },
        { x: 0, z: -2.5 },
        { x: 1.8, z: 1.8 },
        { x: -1.8, z: 1.8 },
        { x: 1.8, z: -1.8 },
        { x: -1.8, z: -1.8 },
        { x: 0, z: 0 },
    ];

    const placed: Array<{ x: number; z: number }> = [];
    let created = 0;

    for (let i = 0; i < weaponTypes.length; i++) {
        const weaponType = weaponTypes[i];
        let selected: { x: number; y: number; z: number } | null = null;

        // Bắt đầu từ marker khác nhau nếu có nhiều marker.
        for (let attempt = 0; attempt < markers.length * offsets.length; attempt++) {
            const marker = markers[
                (i + Math.floor(attempt / offsets.length)) % markers.length
            ];

            const offset = offsets[attempt % offsets.length];
            const x = marker.position.x + offset.x;
            const z = marker.position.z + offset.z;

            // Tìm sàn ngay tại x/z này, không lấy độ cao
            // của marker rồi áp vào tọa độ lệch.
       
            const y = this.collision.getGroundY(
    x,
    z,
    marker.position.y + 0.1,
    8,
    2,
);
            if (y === null) continue;

            // Không đặt súng trong tường hoặc vật cản.
            if (!this.collision.canMoveTo(x, z, 0.35, y, 1.0)) {
                continue;
            }

            // Tránh các khẩu súng nằm quá gần nhau.
            const overlaps = placed.some(
                (position) =>
                    Math.hypot(position.x - x, position.z - z) < 1.5,
            );

            if (overlaps) continue;

            selected = { x, y, z };
            break;
        }

        if (!selected) {
            console.error(
                `[WEAPON] Không tìm được vị trí hợp lệ cho ${weaponType}.`,
            );
            continue;
        }

        const pickup = new WeaponPickupState();
        pickup.id = `weapon-${weaponType}-${i + 1}`;
        pickup.weaponType = weaponType;
        pickup.x = selected.x;
        pickup.y = selected.y;
        pickup.z = selected.z;
        pickup.available = true;

        this.state.weaponPickups.set(pickup.id, pickup);
        placed.push({ x: selected.x, z: selected.z });
        created++;

        console.log("[WEAPON] Đã tạo súng:", {
            id: pickup.id,
            type: pickup.weaponType,
            position: {
                x: pickup.x,
                y: pickup.y,
                z: pickup.z,
            },
        });
    }

    console.log(
        `[WEAPON] Khởi tạo hoàn tất: ${created}/${weaponTypes.length}`,
        "Tổng pickup trong state:",
        this.state.weaponPickups.size,
    );
}


    // ========================================================
    // NHẶT SÚNG
    // ========================================================

    handlePickup(sessionId: string) {
        if (this.state.gameOver) return;

        const player = this.state.players.get(sessionId);

        if (!player || !player.alive) return;

        let nearest: WeaponPickupState | null = null;
        let nearestDistance = Infinity;

        this.state.weaponPickups.forEach((pickup) => {
            if (!pickup.available) return;

            const distance = Math.hypot(
                player.x - pickup.x,
                player.z - pickup.z,
            );

            if (distance < nearestDistance) {
                nearest = pickup;
                nearestDistance = distance;
            }
        });

        if (
            !nearest ||
            nearestDistance > PICKUP_DISTANCE
        ) {
            return;
        }

        const pickup = nearest as WeaponPickupState;

        let slot: 1 | 2;

        if (!player.weapon1) {
            slot = 1;
        } else if (!player.weapon2) {
            slot = 2;
        } else {
            slot = player.equippedSlot === 2 ? 2 : 1;
        }

        if (slot === 1) {
            player.weapon1 = pickup.weaponType;
        } else {
            player.weapon2 = pickup.weaponType;
        }

        player.equippedSlot = slot;
        player.ammo = 999;

        // Xóa khỏi MapSchema để client ngừng render model.
        this.state.weaponPickups.delete(pickup.id);

        this.broadcast("weaponPickedUp", {
            playerId: sessionId,
            weaponType: pickup.weaponType,
            slot,
            pickupId: pickup.id,
        });

        console.log("[WEAPON] Đã nhặt súng:", {
            player: player.name,
            weaponType: pickup.weaponType,
            slot,
            distance: nearestDistance,
        });
    }
}
