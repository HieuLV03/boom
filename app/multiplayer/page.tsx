"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import client from "@/lib/colyseus";
import { useMultiplayerStore } from "@/stores/multiplayer.store";

import "./page.css";

type MapId = "hospital";

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
    const [selectedMap] = useState<MapId>("hospital");
    const [status, setStatus] = useState("Sẵn sàng chơi");
    const [loading, setLoading] = useState(false);

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

    async function joinRoom() {
        if (loading) return;

        const code = roomCode.trim();

        if (!/^\d{6}$/.test(code)) {
            setStatus("Mã phòng phải gồm 6 chữ số.");
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
            <section className="multiplayer-panel">
                <header className="multiplayer-header">
                    <div className="multiplayer-brand">
                        <h1>BOOM</h1>
                        <p>CHƠI CÙNG BẠN BÈ</p>
                    </div>

                    <div className="multiplayer-heading">
                        <span className="multiplayer-eyebrow">
                            MULTIPLAYER
                        </span>
                        <h2>Sẵn sàng chiến đấu?</h2>
                        <p>Tạo phòng mới hoặc nhập mã để tham gia.</p>
                    </div>
                </header>

                <div className="multiplayer-content">
                    <section className="multiplayer-setup">
                        <label
                            className="multiplayer-label"
                            htmlFor="player-name"
                        >
                            TÊN NGƯỜI CHƠI
                        </label>

                        <input
                            id="player-name"
                            className="multiplayer-input"
                            value={name}
                            onChange={(event) =>
                                setName(event.target.value)
                            }
                            placeholder="Nhập tên của bạn"
                            maxLength={20}
                            autoComplete="nickname"
                        />

                        <div className="map-selection">
                            <div className="section-heading">
                                <span className="section-number">01</span>
                                <h3>Bản đồ trận đấu</h3>
                            </div>

                            <div className="map-selection-list">
                                <div
                                    className="map-option map-option-zombie map-option-selected"
                                    aria-current="true"
                                >
                                    <span className="map-option-icon">
                                        🏥
                                    </span>

                                    <span className="map-option-info">
                                        <span className="map-option-name">
                                            Haunted Hospital
                                        </span>
                                        <span className="map-option-description">
                                            Bệnh viện ma ám · GLB 3D
                                        </span>
                                    </span>

                                    <span className="map-option-radio">
                                        ✓
                                    </span>
                                </div>
                            </div>

                            <p className="map-selection-hint">
                                Tất cả người chơi sẽ vào bản đồ bệnh viện.
                            </p>
                        </div>
                    </section>

                    <section className="multiplayer-actions">
                        <div className="action-block">
                            <div className="section-heading">
                                <span className="section-number">02</span>
                                <h3>Tạo trận đấu</h3>
                            </div>

                            <p className="action-description">
                                Tạo phòng mới và mời bạn bè tham gia bằng mã phòng.
                            </p>

                            <button
                                type="button"
                                className="multiplayer-button multiplayer-button-create"
                                onClick={createRoom}
                                disabled={loading}
                            >
                                <span className="button-icon">＋</span>
                                {loading ? "Đang xử lý..." : "Tạo phòng mới"}
                            </button>
                        </div>

                        <div className="join-divider">
                            <span />
                            <b>HOẶC</b>
                            <span />
                        </div>

                        <div className="action-block">
                            <div className="section-heading">
                                <span className="section-number">03</span>
                                <h3>Tham gia phòng</h3>
                            </div>

                            <p className="action-description">
                                Nhập mã phòng của bạn bè để tiếp tục.
                            </p>

                            <form
                                className="join-form"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    void joinRoom();
                                }}
                            >
                                <input
                                    className="multiplayer-input room-code-input"
                                    value={roomCode}
                                    onChange={(event) =>
                                        setRoomCode(
                                            event.target.value
                                                .replace(/\D/g, "")
                                                .slice(0, 6)
                                        )
                                    }
                                    placeholder="Mã phòng 6 chữ số"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    maxLength={6}
                                    aria-label="Mã phòng"
                                    disabled={loading}
                                />

                                <button
                                    type="submit"
                                    className="multiplayer-button multiplayer-button-join"
                                    disabled={loading}
                                >
                                    {loading ? "Đang xử lý..." : "Vào phòng"}
                                    <span aria-hidden="true">→</span>
                                </button>
                            </form>
                        </div>
                    </section>
                </div>

                <footer className="multiplayer-footer">
                    <span className="status-indicator" />
                    <p aria-live="polite">{status}</p>
                    <span className="footer-version">BOOM MULTIPLAYER</span>
                </footer>
            </section>
        </main>
    );
}