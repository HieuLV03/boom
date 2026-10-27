
import express from "express";
import { createServer } from "node:http";
import { Server, matchMaker } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";

import { BattleRoom } from "./rooms/BattleRoom.js";

const PORT = Number(process.env.PORT || 2567);

const app = express();

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

    if (req.method === "OPTIONS") {
        res.status(204).end();
        return;
    }

    next();
});

const httpServer = createServer(app);

const gameServer = new Server({
    transport: new WebSocketTransport({
        server: httpServer,
    }),
});

gameServer
    .define("battle", BattleRoom)
    .filterBy(["roomCode"]);

app.get("/find-room/:roomCode", async (req, res) => {
    try {
        const roomCode = String(req.params.roomCode ?? "").trim();

        if (!/^\d{6}$/.test(roomCode)) {
            res.status(400).json({
                message: "Mã phòng phải gồm 6 chữ số.",
            });
            return;
        }

        const rooms = await matchMaker.query({
            name: "battle",
        });

        const foundRoom = rooms.find((room) => {
            return (
                String(room.metadata?.roomCode ?? "").trim() === roomCode &&
                room.metadata?.roomStatus === "waiting" &&
                room.clients < room.maxClients
            );
        });

        if (!foundRoom) {
            res.status(404).json({
                message: "Không tìm thấy phòng chờ.",
            });
            return;
        }

        res.json({
            roomId: foundRoom.roomId,
            roomCode,
        });
    } catch (error) {
        console.error("[FIND ROOM ERROR]", error);

        res.status(500).json({
            message: "Lỗi máy chủ khi tìm phòng.",
        });
    }
});

gameServer.listen(PORT);

console.log(`[SERVER] BOOM listening on port ${PORT}`);
console.log("[SERVER] Room: battle");
