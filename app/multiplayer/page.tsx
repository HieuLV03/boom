
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import client from "@/lib/colyseus";
import { useMultiplayerStore } from "@/stores/multiplayer.store";

import "./page.css";

type MapId = "tropical-village" | "zombie-house";

function generateRoomCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export default function MultiplayerPage() {
    const router = useRouter();

    const setRoom = useMultiplayerStore(
        (state) => state.setRoom
    );

    const [name, setName] = useState("");
    const [roomCode, setRoomCode] = useState("");
    const [selectedMap, setSelectedMap] =
        useState<MapId>("tropical-village");
    const [status, setStatus] = useState("Chưa kết nối");
    const [loading, setLoading] = useState(false);

    // ========================================================
    // CREATE ROOM
    // ========================================================

    async function createRoom() {
        if (loading) return;

        try {
            setLoading(true);
            setStatus("Đang tạo phòng...");

            const code = generateRoomCode();

            const room = await client.create("battle", {
                name: name.trim() || "Player",
                roomCode: code,
                mapId: selectedMap,
            });

            setRoom(room);

            console.log("[CREATE] Room created", {
                roomId: room.roomId,
                sessionId: room.sessionId,
                roomCode: code,
                mapId: selectedMap,
            });

            router.push(
                `/game?room=${encodeURIComponent(room.roomId)}` +
                `&session=${encodeURIComponent(room.sessionId)}` +
                `&code=${encodeURIComponent(code)}`
            );
        } catch (error) {
            console.error("[CREATE ROOM ERROR]", error);
            setStatus("Không thể tạo phòng. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    }

    // ========================================================
    // JOIN ROOM
    // ========================================================

    async function joinRoom() {
        if (loading) return;

        const code = roomCode.trim();

        if (!/^\d{6}$/.test(code)) {
            setStatus("Mã phòng phải gồm 6 chữ số");
            return;
        }

        try {
            setLoading(true);
            setStatus("Đang vào phòng...");

            const room = await client.join("battle", {
                name: name.trim() || "Player",
                roomCode: code,
            });

            setRoom(room);

            console.log("[JOIN] Room joined", {
                roomId: room.roomId,
                sessionId: room.sessionId,
                roomCode: code,
                mapId: room.state.mapId,
            });

            router.push(
                `/game?room=${encodeURIComponent(room.roomId)}` +
                `&session=${encodeURIComponent(room.sessionId)}` +
                `&code=${encodeURIComponent(code)}`
            );
        } catch (error) {
            console.error("[JOIN ROOM ERROR]", error);
            setStatus("Không tìm thấy phòng hoặc phòng đã đầy.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="multiplayer-page">
            <div className="multiplayer-card">
                <h1 className="multiplayer-title">BOOM</h1>

                <p className="multiplayer-subtitle">
                    Multiplayer
                </p>

                <input
                    className="multiplayer-input"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Tên người chơi"
                    maxLength={20}
                />

                {/* MAP SELECTION */}
                <section className="map-selection">
                    <h2 className="map-selection-title">
                        Chọn bản đồ
                    </h2>

                    <div className="map-selection-list">
                        <button
                            type="button"
                            className={`map-option map-option-village ${
                                selectedMap === "tropical-village"
                                    ? "map-option-selected"
                                    : ""
                            }`}
                            aria-pressed={selectedMap === "tropical-village"}
                            onClick={() => setSelectedMap("tropical-village")}
                        >
                            <span className="map-option-icon">🌴</span>

                            <span className="map-option-name">
                                Tropical Village
                            </span>

                            <span className="map-option-description">
                                Làng nhiệt đới
                            </span>

                            {selectedMap === "tropical-village" && (
                                <span className="map-option-check">
                                    ✓ Đã chọn
                                </span>
                            )}
                        </button>

                        <button
                            type="button"
                            className={`map-option map-option-zombie ${
                                selectedMap === "zombie-house"
                                    ? "map-option-selected"
                                    : ""
                            }`}
                            aria-pressed={selectedMap === "zombie-house"}
                            onClick={() => setSelectedMap("zombie-house")}
                        >
                            <span className="map-option-icon">🧟</span>

                            <span className="map-option-name">
                                Zombie House
                            </span>

                            <span className="map-option-description">
                                Ngôi nhà kinh dị
                            </span>

                            {selectedMap === "zombie-house" && (
                                <span className="map-option-check">
                                    ✓ Đã chọn
                                </span>
                            )}
                        </button>
                    </div>

                    <p className="map-selection-hint">
                        Chủ phòng chọn bản đồ cho toàn bộ trận đấu.
                    </p>
                </section>

                {/* CREATE ROOM */}
                <button
                    type="button"
                    className="multiplayer-button multiplayer-button-create"
                    onClick={createRoom}
                    disabled={loading}
                >
                    {loading ? "Đang xử lý..." : "Tạo phòng"}
                </button>

                <div className="multiplayer-divider">
                    <div className="multiplayer-divider-line" />
                    <span>HOẶC</span>
                    <div className="multiplayer-divider-line" />
                </div>

                {/* JOIN ROOM */}
                <input
                    className="multiplayer-input multiplayer-room-code"
                    value={roomCode}
                    onChange={(event) => {
                        setRoomCode(
                            event.target.value.replace(/\D/g, "").slice(0, 6)
                        );
                    }}
                    placeholder="Nhập mã phòng 6 số"
                    inputMode="numeric"
                    maxLength={6}
                />

                <button
                    type="button"
                    className="multiplayer-button multiplayer-button-join"
                    onClick={joinRoom}
                    disabled={loading}
                >
                    {loading ? "Đang xử lý..." : "Vào phòng"}
                </button>

                <p className="multiplayer-status" aria-live="polite">
                    {status}
                </p>
            </div>
        </main>
    );
}
