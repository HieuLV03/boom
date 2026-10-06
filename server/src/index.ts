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


console.log(
    "[SERVER] Starting..."
);

console.log(
    "[SERVER] PORT:",
    PORT
);

console.log(
    "[SERVER] BattleRoom:",
    BattleRoom
);


const gameServer =
    new Server();


console.log(
    "[SERVER] Defining room: battle"
);


gameServer
    .define(
        "battle",
        BattleRoom
    )
    .filterBy([
        "roomCode",
    ]);


console.log(
    "[SERVER] Room battle registered"
);


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