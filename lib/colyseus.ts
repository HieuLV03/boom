
import { Client } from "@colyseus/sdk";

const serverUrl = (
    process.env.NEXT_PUBLIC_GAME_SERVER_URL ||
    "http://localhost:2567"
)
    .trim()
    .replace(/\/+$/, "");

console.log("[BOOM] Colyseus server URL:", JSON.stringify(serverUrl));

const client = new Client(serverUrl);

export default client;
