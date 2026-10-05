
import {
    Server,
} from "colyseus";

import {
    BattleRoom,
} from "./rooms/BattleRoom.js";


const PORT =
    Number(
        process.env.PORT || 2567
    );


const gameServer =
    new Server();


gameServer
    .define(
        "battle",
        BattleRoom
    )
    .filterBy([
        "roomCode",
    ]);


gameServer.listen(
    PORT
);


console.log(
    "======================================"
);

console.log(
    "        BOOM GAME SERVER"
);

console.log(
    "======================================"
);

console.log(
    `WebSocket: ws://localhost:${PORT}`
);

console.log(
    `Port: ${PORT}`
);

console.log(
    "Room: battle"
);

console.log(
    "======================================"
);
