
import { Client } from "@colyseus/sdk";

const gameServerUrl =
    process.env.NEXT_PUBLIC_GAME_SERVER_URL ||
    "https://boom-server-vyrm.onrender.com";

console.log("[COLYSEUS] Server URL:", gameServerUrl);

const client = new Client(gameServerUrl);

export default client;
