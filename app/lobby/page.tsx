
"use client";

import {
    Suspense,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import {
    useRouter,
    useSearchParams,
} from "next/navigation";

import client from "@/lib/colyseus";

import {
    useMultiplayerStore,
} from "@/stores/multiplayer.store";

import "./page.css";

// ============================================================
// TYPES
// ============================================================

type LobbyPlayer = {
    sessionId: string;
    id: string;
    name: string;
    hp: number;
    alive: boolean;
};

type LobbyRoomState = {
    roomCode?: string;
    roomStatus?: string;
    hostId?: string;

    players?: {
        forEach: (
            callback: (
                player: LobbyPlayer,
                sessionId: string,
            ) => void,
        ) => void;

        get?: (
            sessionId: string,
        ) => LobbyPlayer | undefined;
    };
};

type GameStartingMessage = {
    roomCode?: string;
    mapId?: string;
    battleRoomId?: string;
};

// ============================================================
// LOBBY CONTENT
// ============================================================

function LobbyContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const room = useMultiplayerStore(
        (state) => state.room,
    );

    const hostSessionId = useMultiplayerStore(
        (state) => state.hostSessionId,
    );

    const setHostSessionId = useMultiplayerStore(
        (state) => state.setHostSessionId,
    );

    const clearRoom = useMultiplayerStore(
        (state) => state.clearRoom,
    );

    const setRoom = useMultiplayerStore(
        (state) => state.setRoom,
    );

    const urlCode = searchParams.get("code") || "";

    // ========================================================
    // LOCAL STATE
    // ========================================================

    const [players, setPlayers] = useState<LobbyPlayer[]>([]);
    const [roomStatus, setRoomStatus] = useState("waiting");
    const [hostId, setHostId] = useState("");
    const [starting, setStarting] = useState(false);
    const [message, setMessage] = useState("");
    const [copied, setCopied] = useState(false);

    // Chặn nhiều event gameStarting cùng tham gia battle.
    const joiningBattleRef = useRef(false);

    // Ngăn xử lý event sau khi component đã unmount.
    const mountedRef = useRef(true);

    // Giữ room lobby hiện tại để tránh callback dùng room cũ.
    const roomRef = useRef(room);
    roomRef.current = room;

    // ========================================================
    // SYNC LOBBY STATE
    // ========================================================

    const syncRoomState = useCallback(() => {
        const currentRoom = roomRef.current;

        if (!currentRoom) return;

        const state =
            currentRoom.state as unknown as LobbyRoomState;

        const nextPlayers: LobbyPlayer[] = [];

        state.players?.forEach((player, sessionId) => {
            nextPlayers.push({
                sessionId,
                id: player.id || sessionId,
                name: player.name || "Player",
                hp: Number(player.hp ?? 100),
                alive: player.alive !== false,
            });
        });

        const nextHostId =
            typeof state.hostId === "string"
                ? state.hostId
                : "";

        const nextRoomStatus =
            typeof state.roomStatus === "string"
                ? state.roomStatus
                : "waiting";

        setPlayers(nextPlayers);
        setHostId(nextHostId);
        setRoomStatus(nextRoomStatus);

        if (nextHostId) {
            setHostSessionId(nextHostId);
        }

        console.log("[LOBBY] State synced:", {
            roomId: currentRoom.roomId,
            sessionId: currentRoom.sessionId,
            hostId: nextHostId,
            roomStatus: nextRoomStatus,
            playerCount: nextPlayers.length,
        });
    }, [setHostSessionId]);

    // ========================================================
    // ROOM EVENTS
    // ========================================================

    useEffect(() => {
        mountedRef.current = true;

        const currentRoom = room;

        if (!currentRoom) {
            router.replace("/multiplayer");
            return;
        }

        // Nếu đã chuyển sang battle thì không đăng ký
        // lại listener của lobby.
        if (joiningBattleRef.current) {
            return;
        }

        syncRoomState();

        const handleStateChange = () => {
            syncRoomState();
        };

        const handleHostChanged = (data: unknown) => {
            if (
                !data ||
                typeof data !== "object" ||
                !("hostId" in data)
            ) {
                return;
            }

            const nextHostId = String(data.hostId ?? "");

            setHostId(nextHostId);

            if (nextHostId) {
                setHostSessionId(nextHostId);
            }

            console.log("[LOBBY] Host changed:", nextHostId);
        };

        const handleStartError = (data: unknown) => {
            if (joiningBattleRef.current) return;

            setStarting(false);

            if (
                data &&
                typeof data === "object" &&
                "message" in data
            ) {
                setMessage(String(data.message));
                return;
            }

            setMessage(
                typeof data === "string"
                    ? data
                    : "Không thể bắt đầu trận đấu.",
            );
        };

        // ====================================================
        // JOIN BATTLE
        // ====================================================

        const handleGameStarting = async (
            data: GameStartingMessage,
        ) => {
            console.log(
                "[LOBBY] Received gameStarting:",
                data,
            );

            if (joiningBattleRef.current) {
                console.log(
                    "[LOBBY] Đang chuyển sang battle, bỏ qua event trùng.",
                );
                return;
            }

            const battleRoomId = data?.battleRoomId;

            if (
                typeof battleRoomId !== "string" ||
                battleRoomId.length === 0
            ) {
                setStarting(false);
                setMessage(
                    "Máy chủ không gửi battleRoomId hợp lệ.",
                );

                console.error(
                    "[LOBBY] Missing battleRoomId:",
                    data,
                );

                return;
            }

            joiningBattleRef.current = true;
            setStarting(true);
            setMessage("Đang tham gia trận đấu...");

            try {
                const lobbyState =
                    currentRoom.state as unknown as LobbyRoomState;

                const currentPlayer =
                    lobbyState.players?.get?.(
                        currentRoom.sessionId,
                    );

                const playerName =
                    currentPlayer?.name?.trim() || "Player";

                const code =
                    data.roomCode ||
                    lobbyState.roomCode ||
                    urlCode;

                console.log(
                    "[LOBBY] Joining shared BattleRoom:",
                    {
                        lobbyRoomId: currentRoom.roomId,
                        lobbySessionId: currentRoom.sessionId,
                        battleRoomId,
                        roomCode: code,
                        playerName,
                    },
                );

                // Tất cả client nhận cùng battleRoomId,
                // vì vậy đều tham gia đúng một BattleRoom.
                const battleRoom = await client.joinById(
                    battleRoomId,
                    {
                        name: playerName,
                        roomCode: code,
                    },
                );

                console.log(
                    "[LOBBY] Battle join successful:",
                    {
                        roomId: battleRoom.roomId,
                        sessionId: battleRoom.sessionId,
                        stateKeys: battleRoom.state
                            ? Object.keys(battleRoom.state)
                            : [],
                    },
                );

                // Tránh điều hướng nếu component đã bị hủy.
                if (!mountedRef.current) {
                    await battleRoom.leave();
                    return;
                }

                // Cập nhật store sang kết nối BattleRoom.
                setRoom(battleRoom);

                // Chỉ chuyển trang sau khi joinById thành công.
                router.replace(
                    `/game?code=${encodeURIComponent(code)}`,
                );
            } catch (error) {
                console.error(
                    "[LOBBY] Join BattleRoom failed:",
                    error,
                );

                joiningBattleRef.current = false;

                if (mountedRef.current) {
                    setStarting(false);
                    setMessage(
                        "Không thể tham gia trận đấu. Kiểm tra BattleRoom và kết nối máy chủ.",
                    );
                }
            }
        };

        const handleGameStartingMessage = (
            data: GameStartingMessage,
        ) => {
            void handleGameStarting(data);
        };

        // Đăng ký listener.
        currentRoom.onStateChange(handleStateChange);

        const unsubscribeHostChanged =
            currentRoom.onMessage(
                "hostChanged",
                handleHostChanged,
            );

        const unsubscribeStartError =
            currentRoom.onMessage(
                "startGameError",
                handleStartError,
            );

        const unsubscribeGameStarting =
            currentRoom.onMessage(
                "gameStarting",
                handleGameStartingMessage,
            );

        return () => {
            mountedRef.current = false;

            // Gỡ callback state bằng đúng callback đã đăng ký.
            currentRoom.onStateChange.remove(
                handleStateChange,
            );

            unsubscribeHostChanged();
            unsubscribeStartError();
            unsubscribeGameStarting();
        };
    }, [
        room,
        router,
        syncRoomState,
        setHostSessionId,
        setRoom,
        urlCode,
    ]);

    // ========================================================
    // LOADING
    // ========================================================

    if (!room) {
        return (
            <main className="lobby-page">
                <div className="lobby-loading">
                    Đang kết nối phòng...
                </div>
            </main>
        );
    }

    // ========================================================
    // DERIVED STATE
    // ========================================================

    const state =
        room.state as unknown as LobbyRoomState;

    const roomCode =
        urlCode || state.roomCode || "";

    const effectiveHostId =
        hostId || state.hostId || hostSessionId || "";

    const isHost =
        Boolean(room.sessionId) &&
        effectiveHostId === room.sessionId;

    const isWaiting =
        roomStatus === "waiting";

    const canStart =
        isHost &&
        isWaiting &&
        !starting &&
        !joiningBattleRef.current;

    // ========================================================
    // LEAVE ROOM
    // ========================================================

    async function leaveRoom() {
        const currentRoom = room;

        joiningBattleRef.current = true;

        clearRoom();
        router.replace("/multiplayer");

        if (!currentRoom) return;

        try {
            await currentRoom.leave();
        } catch (error) {
            console.warn(
                "[LOBBY] Room leave failed:",
                error,
            );
        }
    }

    // ========================================================
    // START GAME
    // ========================================================

    function startGame() {
        const currentRoom = room;

        if (!currentRoom) {
            setMessage("Không tìm thấy kết nối phòng.");
            return;
        }

        if (!isHost) {
            setMessage("Chỉ chủ phòng mới được bắt đầu.");
            return;
        }

        if (roomStatus !== "waiting") {
            setMessage(
                `Phòng hiện không ở trạng thái chờ: ${roomStatus}`,
            );
            return;
        }

        if (
            starting ||
            joiningBattleRef.current
        ) {
            return;
        }

        setStarting(true);
        setMessage("Đang yêu cầu máy chủ bắt đầu trận đấu...");

        try {
            currentRoom.send("startGame");

            console.log("[LOBBY] Sent startGame:", {
                roomId: currentRoom.roomId,
                sessionId: currentRoom.sessionId,
            });
        } catch (error) {
            console.error(
                "[LOBBY] Start game send failed:",
                error,
            );

            setStarting(false);
            setMessage(
                "Không thể gửi yêu cầu bắt đầu trận đấu.",
            );
        }
    }

    // ========================================================
    // COPY ROOM CODE
    // ========================================================

    async function copyRoomCode() {
        if (!roomCode) return;

        try {
            await navigator.clipboard.writeText(roomCode);

            setCopied(true);

            window.setTimeout(() => {
                setCopied(false);
            }, 1800);
        } catch {
            setMessage(
                "Không thể sao chép mã. Hãy sao chép thủ công.",
            );
        }
    }

    // ========================================================
    // UI
    // ========================================================

    return (
        <main className="lobby-page">
            <div className="lobby-background" />

            <section className="lobby-shell">
                <header className="lobby-header">
                    <button
                        type="button"
                        className="lobby-back-button"
                        onClick={() => void leaveRoom()}
                    >
                        <span aria-hidden="true">←</span>
                        Rời phòng
                    </button>

                    <div className="lobby-brand">
                        <span className="lobby-brand-name">
                            BOOM
                        </span>
                        <span className="lobby-brand-subtitle">
                            MULTIPLAYER
                        </span>
                    </div>

                    <div className="lobby-header-actions">
                        <div className="lobby-connection">
                            <span className="lobby-online-dot" />
                            ĐÃ KẾT NỐI
                        </div>

                        {isHost && (
                            <button
                                type="button"
                                className="lobby-start-button lobby-header-start-button"
                                onClick={startGame}
                                disabled={!canStart}
                            >
                                {starting
                                    ? "ĐANG BẮT ĐẦU..."
                                    : "BẮT ĐẦU TRẬN"}
                                <span aria-hidden="true">→</span>
                            </button>
                        )}
                    </div>
                </header>

                <section className="lobby-hero">
                    <div className="lobby-eyebrow">
                        <span />
                        HAUNTED HOSPITAL
                    </div>

                    <h1>
                        SẢNH <span>CHỜ</span>
                    </h1>

                    <p className="lobby-description">
                        Tập hợp đồng đội. Chuẩn bị bước vào
                        bệnh viện ma ám.
                    </p>
                </section>

                <section className="lobby-room-card">
                    <div className="lobby-room-info">
                        <span className="lobby-label">
                            MÃ PHÒNG
                        </span>

                        <strong className="lobby-room-code">
                            {roomCode || "------"}
                        </strong>

                        <span className="lobby-room-hint">
                            Chia sẻ mã này với bạn bè
                        </span>
                    </div>

                    <button
                        type="button"
                        className="lobby-copy-button"
                        onClick={() => void copyRoomCode()}
                        disabled={!roomCode}
                    >
                        <span aria-hidden="true">
                            {copied ? "✓" : "▣"}
                        </span>
                        {copied
                            ? "Đã sao chép"
                            : "Sao chép mã"}
                    </button>
                </section>

                <section className="lobby-main-grid">
                    <div className="lobby-players-panel">
                        <div className="lobby-section-header">
                            <div>
                                <span className="lobby-label">
                                    ĐỘI CỦA BẠN
                                </span>
                                <h2>Người chơi</h2>
                            </div>

                            <span className="lobby-player-count">
                                {players.length} / 10
                            </span>
                        </div>

                        <div className="lobby-player-list">
                            {players.map((player) => {
                                const playerIsHost =
                                    player.sessionId === effectiveHostId;

                                const isCurrentPlayer =
                                    player.sessionId === room.sessionId;

                                return (
                                    <article
                                        className="lobby-player"
                                        key={player.sessionId}
                                    >
                                        <div className="lobby-player-avatar">
                                            {player.name
                                                .slice(0, 1)
                                                .toUpperCase()}
                                        </div>

                                        <div className="lobby-player-details">
                                            <strong>
                                                {player.name}

                                                {isCurrentPlayer && (
                                                    <span className="lobby-you">
                                                        BẠN
                                                    </span>
                                                )}
                                            </strong>

                                            <span>
                                                {playerIsHost
                                                    ? "Chủ phòng"
                                                    : "Thành viên"}
                                            </span>
                                        </div>

                                        {playerIsHost ? (
                                            <span className="lobby-host-badge">
                                                ★ CHỦ PHÒNG
                                            </span>
                                        ) : (
                                            <span className="lobby-ready-dot" />
                                        )}
                                    </article>
                                );
                            })}

                            {players.length < 10 && isWaiting && (
                                <div className="lobby-empty-slot">
                                    <span>＋</span>
                                    <p>
                                        Đang chờ đồng đội tham gia...
                                    </p>
                                </div>
                            )}

                            {players.length === 0 && (
                                <div className="lobby-empty-state">
                                    Đang tải danh sách người chơi...
                                </div>
                            )}
                        </div>

                        <p className="lobby-live-hint">
                            <span className="lobby-online-dot" />
                            Danh sách được cập nhật tự động
                        </p>
                    </div>

                    <aside className="lobby-match-panel">
                        <span className="lobby-label">
                            THÔNG TIN TRẬN ĐẤU
                        </span>

                        <div className="lobby-map-preview">
                            <div className="lobby-map-icon">
                                🏥
                            </div>

                            <div>
                                <h3>Haunted Hospital</h3>
                                <p>Bệnh viện ma ám</p>
                            </div>
                        </div>

                        <div className="lobby-match-row">
                            <span>Chế độ</span>
                            <strong>Multiplayer</strong>
                        </div>

                        <div className="lobby-match-row">
                            <span>Người chơi</span>
                            <strong>{players.length} / 10</strong>
                        </div>

                        <div className="lobby-match-row">
                            <span>Trạng thái</span>
                            <strong className="lobby-waiting-status">
                                {isWaiting ? "Đang chờ" : roomStatus}
                            </strong>
                        </div>

                        <div className="lobby-divider" />

                        <div className="lobby-start-area">
                            {isHost ? (
                                <>
                                    <p className="lobby-start-hint">
                                        Bạn có thể bắt đầu ngay,
                                        kể cả khi chơi một mình.
                                    </p>

                                    <button
                                        type="button"
                                        className="lobby-start-button"
                                        onClick={startGame}
                                        disabled={!canStart}
                                    >
                                        {starting
                                            ? "ĐANG BẮT ĐẦU..."
                                            : "BẮT ĐẦU TRẬN"}

                                        <span aria-hidden="true">
                                            →
                                        </span>
                                    </button>
                                </>
                            ) : (
                                <div className="lobby-waiting-box">
                                    <span className="lobby-pulse-dot" />

                                    <div>
                                        <strong>
                                            Đang chờ chủ phòng
                                        </strong>
                                        <p>
                                            Chủ phòng sẽ quyết định
                                            khi nào bắt đầu trận đấu.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <p
                                style={{
                                    marginTop: 10,
                                    fontSize: 12,
                                    color: "#ffcc66",
                                    overflowWrap: "anywhere",
                                }}
                            >
                                Debug: host={String(isHost)} |
                                status={roomStatus} |
                                starting={String(starting)}
                            </p>
                        </div>

                        {message && (
                            <p
                                className="lobby-message"
                                role="status"
                            >
                                {message}
                            </p>
                        )}
                    </aside>
                </section>

                <footer className="lobby-footer">
                    <span>BOOM · HAUNTED HOSPITAL</span>
                    <span>ĐỪNG ĐI MỘT MÌNH</span>
                </footer>
            </section>
        </main>
    );
}

// ============================================================
// PAGE
// ============================================================

export default function LobbyPage() {
    return (
        <Suspense
            fallback={
                <main className="lobby-page">
                    <div className="lobby-loading">
                        Đang tải sảnh chờ...
                    </div>
                </main>
            }
        >
            <LobbyContent />
        </Suspense>
    );
}
