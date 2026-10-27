
import express from "express";
import { createServer } from "node:http";
import { Server, matchMaker } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";

import { LobbyRoom } from "./rooms/LobbyRoom.js";
import { BattleRoom } from "./rooms/BattleRoom.js";

const PORT = Number(process.env.PORT || 2567);

const app = express();

// ============================================================
// CORS CONFIGURATION
// ============================================================

const allowedOrigins = new Set<string>([
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.2.46:3000",
]);

function buildCorsHeaders(
    origin: string | undefined
): Record<string, string> {
    const corsHeaders: Record<string, string> = {
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers":
            "Origin, X-Requested-With, Content-Type, Accept, Authorization",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
        "Vary": "Origin",
    };

    if (origin && allowedOrigins.has(origin)) {
        corsHeaders["Access-Control-Allow-Origin"] = origin;
    }

    return corsHeaders;
}

// ============================================================
// EXPRESS CORS
// Dùng cho /health và /find-room/:roomCode
// ============================================================

app.use((req, res, next) => {
    const origin = req.headers.origin;
    const corsHeaders = buildCorsHeaders(origin);

    for (const [key, value] of Object.entries(corsHeaders)) {
        res.setHeader(key, value);
    }

    if (req.method === "OPTIONS") {
        if (!origin || !allowedOrigins.has(origin)) {
            res.status(403).end();
            return;
        }

        res.status(204).end();
        return;
    }

    if (origin && !allowedOrigins.has(origin)) {
        res.status(403).json({
            message: "Origin không được phép truy cập.",
        });
        return;
    }

    next();
});

// ============================================================
// HTTP + COLYSEUS SERVER
// ============================================================

const httpServer = createServer(app);

const gameServer = new Server({
    transport: new WebSocketTransport({
        server: httpServer,
    }),
});

// ============================================================
// COLYSEUS MATCHMAKER CORS
// Quan trọng: không trả Access-Control-Allow-Origin: *
// khi client gửi request có credentials.
// ============================================================


matchMaker.controller.getCorsHeaders = (req) => {
    const origin = req.get("origin");

    return buildCorsHeaders(origin ?? undefined);
};

// ============================================================
// REGISTER ROOMS
// ============================================================

// Sảnh chờ: không tải collision bản đồ trận đấu tại đây.
gameServer
    .define("lobby", LobbyRoom)
    .filterBy(["roomCode"]);

// Phòng trận đấu.
gameServer.define("battle", BattleRoom);

// ============================================================
// HEALTH CHECK
// ============================================================

app.get("/health", (_req, res) => {
    res.status(200).json({
        ok: true,
        service: "BOOM server",
    });
});

// ============================================================
// FIND LOBBY BY ROOM CODE
// ============================================================

app.get("/find-room/:roomCode", async (req, res) => {
    try {
        const roomCode = String(
            req.params.roomCode ?? ""
        ).trim();

        if (!/^\d{6}$/.test(roomCode)) {
            res.status(400).json({
                message: "Mã phòng phải gồm 6 chữ số.",
            });
            return;
        }

        const rooms = await matchMaker.query({
            name: "lobby",
        });

        console.log(
            "[FIND LOBBY] Requested code:",
            roomCode
        );

        console.log(
            "[FIND LOBBY] Available rooms:",
            JSON.stringify(
                rooms.map((room) => ({
                    roomId: room.roomId,
                    name: room.name,
                    clients: room.clients,
                    maxClients: room.maxClients,
                    metadata: room.metadata,
                })),
                null,
                2
            )
        );

        const foundRoom = rooms.find((room) => {
            const metadata = room.metadata as
                | {
                      roomCode?: string | number;
                      roomStatus?: string;
                  }
                | undefined;

            return (
                String(metadata?.roomCode ?? "").trim() ===
                    roomCode &&
                metadata?.roomStatus === "waiting" &&
                room.clients < room.maxClients
            );
        });

        if (!foundRoom) {
            res.status(404).json({
                message: "Không tìm thấy sảnh chờ có mã này.",
            });
            return;
        }

        res.status(200).json({
            roomId: foundRoom.roomId,
            roomCode,
        });
    } catch (error) {
        console.error("[FIND LOBBY ERROR]", error);

        res.status(500).json({
            message: "Lỗi máy chủ khi tìm sảnh chờ.",
        });
    }
});

// ============================================================
// START SERVER
// ============================================================

async function main() {
    try {
        await gameServer.listen(PORT);

        console.log(
            `[SERVER] BOOM listening on port ${PORT}`
        );
        console.log("[SERVER] Lobby room: lobby");
        console.log("[SERVER] Battle room: battle");
        console.log("[SERVER] Health: /health");
    } catch (error) {
        console.error(
            "[SERVER] Failed to start:",
            error
        );

        process.exitCode = 1;
    }
}

void main();
