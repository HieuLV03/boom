import { Server, } from "colyseus";
import { BattleRoom, } from "./rooms/BattleRoom.js";
// ============================================================
// CONFIG
// ============================================================
const PORT = Number(process.env.PORT || 2567);
// ============================================================
// COLYSEUS SERVER
// ============================================================
const gameServer = new Server();
// ============================================================
// ROOMS
// ============================================================
gameServer.define("battle", BattleRoom);
// ============================================================
// START
// ============================================================
gameServer.listen(PORT);
console.log("======================================");
console.log("        BOOM GAME SERVER");
console.log("======================================");
console.log(`WebSocket: ws://localhost:${PORT}`);
console.log(`Port: ${PORT}`);
console.log("Room: battle");
console.log("======================================");
//# sourceMappingURL=index.js.map