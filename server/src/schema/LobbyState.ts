
import { MapSchema, Schema, type } from "@colyseus/schema";

export class LobbyPlayerState extends Schema {
    @type("string")
    id = "";

    @type("string")
    name = "";
}

export class LobbyState extends Schema {
    @type("string")
    roomCode = "";

    @type("string")
    hostId = "";

    @type("string")
    roomStatus = "waiting";

    @type({ map: LobbyPlayerState })
    players = new MapSchema<LobbyPlayerState>();
}
