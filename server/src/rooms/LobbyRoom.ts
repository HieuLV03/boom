
import { Client, Room, type RoomOptions } from "colyseus";
import { LobbyState, LobbyPlayerState } from "../schema/LobbyState.js";

const MATCH_DURATION = 300;

interface LobbyRoomOptions extends RoomOptions {
    roomCode?: string;
    mapId?: string;
    name?: string;
}

function generateRoomCode(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
}

export class LobbyRoom extends Room<LobbyRoomOptions> {
    maxClients = 10;

    state = new LobbyState();

    private hostSessionId: string | null = null;
    private mapId = "hospital";
    private startingGame = false;

    async onCreate(options: LobbyRoomOptions): Promise<void> {
        this.mapId =
            typeof options.mapId === "string"
                ? options.mapId
                : "hospital";

        const roomCode =
            typeof options.roomCode === "string" &&
            /^\d{6}$/.test(options.roomCode)
                ? options.roomCode
                : generateRoomCode();

        this.state.roomCode = roomCode;
        this.state.hostId = "";
        this.state.roomStatus = "waiting";

        await this.setMetadata({
            roomCode,
            mapId: this.mapId,
            roomStatus: "waiting",
        });

        this.registerMessages();

        console.log("[LobbyRoom] Ready:", {
            roomId: this.roomId,
            roomCode,
        });
    }

    private registerMessages(): void {
        this.onMessage("startGame", async (client) => {
            if (!this.state.players.has(client.sessionId)) {
                client.send("startGameError", {
                    message: "Bạn không còn ở trong sảnh.",
                });
                return;
            }

            if (client.sessionId !== this.hostSessionId) {
                client.send("startGameError", {
                    message: "Chỉ chủ phòng mới được bắt đầu.",
                });
                return;
            }

            if (
                this.state.roomStatus !== "waiting" ||
                this.startingGame
            ) {
                client.send("startGameError", {
                    message: "Phòng đang xử lý hoặc không còn chờ.",
                });
                return;
            }

            if (this.state.players.size < 1) {
                client.send("startGameError", {
                    message: "Không có người chơi trong phòng.",
                });
                return;
            }

            this.startingGame = true;

            try {
                /*
                 * Chỉ tạo BattleRoom ở bước này.
                 * BattleRoom cần tự tải collision và khởi tạo gameplay.
                 */
                const battleRoom = await this.createBattleRoom();
this.state.roomStatus = "playing";

await this.setMetadata({
    roomCode: this.state.roomCode,
    mapId: this.mapId,
    roomStatus: "playing",
    battleRoomId: battleRoom.roomId,
});

this.broadcast("gameStarting", {
    roomCode: this.state.roomCode,
    mapId: this.mapId,
    battleRoomId: battleRoom.roomId,
});

console.log("[LobbyRoom] Game started:", {
    lobbyRoomId: this.roomId,
    battleRoomId: battleRoom.roomId,
    roomCode: this.state.roomCode,
});
                console.log("[LobbyRoom] Battle room created:", {
                    lobbyRoomId: this.roomId,
                    battleRoomId: battleRoom.roomId,
                });
            } catch (error) {
                console.error("[LobbyRoom] Start game failed:", error);

                this.state.roomStatus = "waiting";

                await this.setMetadata({
                    roomCode: this.state.roomCode,
                    mapId: this.mapId,
                    roomStatus: "waiting",
                });

                client.send("startGameError", {
                    message: "Không thể tạo trận đấu. Vui lòng thử lại.",
                });
            } finally {
                this.startingGame = false;
            }
        });
    }

    private async createBattleRoom() {
        /*
         * Tạo BattleRoom bằng matchMaker để giữ quyền quản lý
         * room ở server. Cần đăng ký room "battle" trong index.ts.
         */
        const { matchMaker } = await import("colyseus");

        return matchMaker.createRoom("battle", {
            roomCode: this.state.roomCode,
            mapId: this.mapId,
        });
    }

    onJoin(client: Client, options: LobbyRoomOptions): void {
        if (this.state.roomStatus !== "waiting") {
            throw new Error("Sảnh không còn nhận người chơi.");
        }

        if (
            options.roomCode &&
            options.roomCode !== this.state.roomCode
        ) {
            throw new Error("Mã phòng không chính xác.");
        }

        if (!this.hostSessionId) {
            this.hostSessionId = client.sessionId;
        }

        const player = new LobbyPlayerState();

        player.id = client.sessionId;
        player.name =
            typeof options.name === "string" && options.name.trim()
                ? options.name.trim().slice(0, 24)
                : `Player ${this.state.players.size + 1}`;

        this.state.players.set(client.sessionId, player);
        this.state.hostId = this.hostSessionId;

        this.broadcast("hostChanged", {
            hostId: this.state.hostId,
        });

        console.log("[LobbyRoom] Player joined:", {
            name: player.name,
            sessionId: client.sessionId,
            hostId: this.state.hostId,
            players: this.state.players.size,
        });
    }

    onLeave(client: Client): void {
        this.state.players.delete(client.sessionId);

        if (this.hostSessionId === client.sessionId) {
            const nextHost = this.state.players.keys().next();

            this.hostSessionId = nextHost.done
                ? null
                : nextHost.value;
        }

        this.state.hostId = this.hostSessionId ?? "";

        this.broadcast("hostChanged", {
            hostId: this.state.hostId,
        });

        console.log("[LobbyRoom] Player left:", {
            sessionId: client.sessionId,
            hostId: this.state.hostId,
            players: this.state.players.size,
        });
    }

    onDispose(): void {
        console.log("[LobbyRoom] Disposed:", this.roomId);
    }
}
