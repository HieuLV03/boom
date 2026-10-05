import { Client } from "@colyseus/sdk";

const client = new Client(
    "ws://localhost:2567"
);

export default client;