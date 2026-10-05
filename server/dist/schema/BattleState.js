var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Schema, MapSchema, type, } from "@colyseus/schema";
// ============================================================
// PLAYER STATE
// ============================================================
export class PlayerState extends Schema {
    constructor() {
        super(...arguments);
        this.id = "";
        this.name = "";
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.rotation = 0;
        this.hp = 100;
        this.alive = true;
    }
}
__decorate([
    type("string")
], PlayerState.prototype, "id", void 0);
__decorate([
    type("string")
], PlayerState.prototype, "name", void 0);
__decorate([
    type("number")
], PlayerState.prototype, "x", void 0);
__decorate([
    type("number")
], PlayerState.prototype, "y", void 0);
__decorate([
    type("number")
], PlayerState.prototype, "z", void 0);
__decorate([
    type("number")
], PlayerState.prototype, "rotation", void 0);
__decorate([
    type("number")
], PlayerState.prototype, "hp", void 0);
__decorate([
    type("boolean")
], PlayerState.prototype, "alive", void 0);
// ============================================================
// BATTLE STATE
// ============================================================
export class BattleState extends Schema {
    constructor() {
        super(...arguments);
        this.roomCode = "";
        this.players = new MapSchema();
    }
}
__decorate([
    type("string")
], BattleState.prototype, "roomCode", void 0);
__decorate([
    type({
        map: PlayerState,
    })
], BattleState.prototype, "players", void 0);
//# sourceMappingURL=BattleState.js.map