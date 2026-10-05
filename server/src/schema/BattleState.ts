import {
    Schema,
    MapSchema,
    type,
} from "@colyseus/schema";


// ============================================================
// PLAYER STATE
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
// BATTLE STATE
// ============================================================

export class BattleState extends Schema {

    @type("string")
    roomCode: string = "";

    @type({
        map: PlayerState,
    })
    players =
        new MapSchema<PlayerState>();
}