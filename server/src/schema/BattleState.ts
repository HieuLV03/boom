import {
    Schema,
    MapSchema,
    type,
} from "@colyseus/schema";

// ============================================================
// PLAYER
// ============================================================
export class PlayerState extends Schema {
    @type("string")
    id: string = "";

    @type("string")
    name: string = "";
@type("boolean")
moving: boolean = false;

@type("boolean")
aiming: boolean = false;
@type("boolean")
crouching: boolean = false;

@type("number")
jumpTrigger: number = 0;

@type("number")
x: number = 0;

    @type("number")
    y: number = 0;

    @type("number")
    z: number = 0;

    @type("number")
    rotation: number = 0;

    @type("number")
    hp: number = 100;

    @type("boolean")
    alive: boolean = true;

    @type("string")
    weapon1: string = "";

    @type("string")
    weapon2: string = "";

    @type("number")
    equippedSlot: number = 0;

    @type("number")
    ammo: number = 0;
}

// ============================================================
// BOMB
// ============================================================

export class BombState extends Schema {

    @type("string")
    id: string = "";

    @type("string")
    ownerId: string = "";

    @type("string")
    bombType: string = "normal";

    @type("number")
    x: number = 0;

    @type("number")
    y: number = 0;

    @type("number")
    z: number = 0;

    @type("number")
    radius: number = 4;

    @type("number")
    damage: number = 100;

    @type("number")
    remaining: number = 3;

    @type("boolean")
    exploded: boolean = false;

    @type("string")
    explosionType: string = "circle";
}

export class WeaponPickupState extends Schema {
    @type("string")
    id: string = "";

    @type("string")
    weaponType: string = "rifle";

    @type("number")
    x: number = 0;

    @type("number")
    y: number = 0;

    @type("number")
    z: number = 0;

    @type("boolean")
    available: boolean = true;
}

export class DoorState extends Schema {
    @type("string")
    id: string = "";

    // Giữ lại cho các map cũ dùng grid.
    @type("number")
    cellX: number = 0;

    @type("number")
    cellZ: number = 0;

    @type("string")
    axis: string = "x";

    // Tọa độ cửa trên bệnh viện dựng bằng code.
    @type("number")
    x: number = 0;

    @type("number")
    y: number = 0;

    @type("number")
    z: number = 0;

    @type("number")
    floor: number = 0;

    // false = đóng, true = mở.
    @type("boolean")
    open: boolean = false;
}

// ============================================================
// ZOMBIE NPC
// ============================================================

export class ZombieState extends Schema {
    @type("string")
    id: string = "";

    @type("number")
    x: number = 0;

    @type("number")
    y: number = 0;

    @type("number")
    z: number = 0;

    @type("number")
    rotation: number = 0;

    @type("number")
    hp: number = 100;

    @type("boolean")
    alive: boolean = true;

    @type("boolean")
    moving: boolean = false;

    @type("boolean")
    attacking: boolean = false;
}
// ============================================================
// BATTLE STATE
// ============================================================

// ============================================================
// BATTLE STATE
// ============================================================

export class BattleState extends Schema {
    @type("string")
    roomCode: string = "";

    @type("string")
    mapId: string = "hospital";

    // waiting = phòng chờ
    // playing = đang chơi
    // finished = trận đã kết thúc
    @type("string")
    roomStatus: string = "waiting";

    // ID Colyseus của chủ phòng.
    @type("string")
    hostId: string = "";

    @type("number")
    timeRemaining: number = 300;

    @type("boolean")
    gameOver: boolean = false;

    @type({ map: PlayerState })
    players = new MapSchema<PlayerState>();

    @type({ map: BombState })
    bombs = new MapSchema<BombState>();

    @type({ map: WeaponPickupState })
    weaponPickups = new MapSchema<WeaponPickupState>();

    @type({ map: DoorState })
    doors = new MapSchema<DoorState>();

    @type({ map: ZombieState })
    zombies = new MapSchema<ZombieState>();
}