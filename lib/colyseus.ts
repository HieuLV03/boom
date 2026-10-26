
import { Client } from "@colyseus/sdk";

const gameServerUrl =
    process.env.NEXT_PUBLIC_GAME_SERVER_URL ||
    "ws://localhost:2567";
    

console.log("[COLYSEUS] Server URL:", gameServerUrl);

const client = new Client(gameServerUrl);

export default client;
