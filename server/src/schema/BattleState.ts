
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


// ============================================================
// BATTLE STATE
// ============================================================

export class BattleState extends Schema {

    // ========================================================
    // ROOM
    // ========================================================

    @type("string")
    roomCode: string = "";


    // ========================================================
    // GAME TIMER
    // ========================================================

    /*
     * Thời gian còn lại của trận đấu.
     *
     * 180 = 3 phút.
     *
     * Server giảm mỗi giây.
     */

    @type("number")
    timeRemaining: number = 180;


    // ========================================================
    // GAME OVER
    // ========================================================

    /*
     * false = game đang chơi
     * true  = trận đã kết thúc
     */

    @type("boolean")
    gameOver: boolean = false;


    // ========================================================
    // PLAYERS
    // ========================================================

    @type({ map: PlayerState })
    players =
        new MapSchema<PlayerState>();


    // ========================================================
    // BOMBS
    // ========================================================

    @type({ map: BombState })
    bombs =
        new MapSchema<BombState>();

}
