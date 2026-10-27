
import { Client } from "@colyseus/sdk";

const serverUrl = (
    process.env.NEXT_PUBLIC_GAME_SERVER_URL ||
    "https://boom-server-vyrm.onrender.com"
)
    .trim()
    .replace(/\/+$/, "");

console.log("[BOOM] Colyseus server URL:", JSON.stringify(serverUrl));

const client = new Client(serverUrl);

export default client;
