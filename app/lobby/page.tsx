
"use client";

import {
    Suspense,
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    useRouter,
    useSearchParams,
} from "next/navigation";

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
                sessionId: string
            ) => void
        ) => void;
    };
};

// ============================================================
// LOBBY CONTENT
// ============================================================

function LobbyContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const room = useMultiplayerStore((state) => state.room);
    const hostSessionId = useMultiplayerStore(
        (state) => state.hostSessionId
    );
    const setHostSessionId = useMultiplayerStore(
        (state) => state.setHostSessionId
    );
    const clearRoom = useMultiplayerStore(
        (state) => state.clearRoom
    );

    const urlCode = searchParams.get("code") || "";

    const [players, setPlayers] = useState<LobbyPlayer[]>([]);
    const [roomStatus, setRoomStatus] = useState("waiting");
    const [hostId, setHostId] = useState("");
    const [starting, setStarting] = useState(false);
    const [message, setMessage] = useState("");
    const [copied, setCopied] = useState(false);

    // ========================================================
    // SYNC SERVER STATE
    // ========================================================

    const syncRoomState = useCallback(() => {
        if (!room) return;

        const state = room.state as unknown as LobbyRoomState;
        const nextPlayers: LobbyPlayer[] = [];

       
state.players?.forEach((player, sessionId) => {
    nextPlayers.push({
        sessionId: sessionId,
        id: player.id || sessionId,
        name: player.name || "Player",
        hp: Number(player.hp ?? 100),
        alive: player.alive !== false,
    });
});


const nextHostId =
    typeof state.hostId === "string" && state.hostId.length > 0
        ? state.hostId
        : null;

setPlayers(nextPlayers);
setRoomStatus(state.roomStatus || "waiting");

if (nextHostId) {
    setHostId(nextHostId);
    setHostSessionId(nextHostId);
}

    }, [room, setHostSessionId]);

    // ========================================================
    // ROOM EVENTS
    // ========================================================

    useEffect(() => {
        const currentRoom = room;

        if (!currentRoom) {
            router.replace("/multiplayer");
            return;
        }

        syncRoomState();

        const handleStateChange = () => {
            syncRoomState();
        };

        const handleStartError = (data: unknown) => {
            setStarting(false);

            if (typeof data === "string") {
                setMessage(data);
                return;
            }

            if (
                data !== null &&
                typeof data === "object" &&
                "message" in data
            ) {
                setMessage(String(data.message));
                return;
            }

            setMessage("Không thể bắt đầu trận đấu.");
        };

        // onStateChange trả về EventEmitter, không phải hàm unsubscribe.
        currentRoom.onStateChange(handleStateChange);

        // onMessage trả về hàm unsubscribe.
        const unsubscribeStartError = currentRoom.onMessage(
            "startGameError",
            handleStartError
        );

        return () => {
            currentRoom.onStateChange.remove(handleStateChange);
            unsubscribeStartError();
        };
    }, [room, router, syncRoomState]);

    // ========================================================
    // AUTO NAVIGATE WHEN GAME STARTS
    // ========================================================

    useEffect(() => {
        const currentRoom = room;

        if (!currentRoom || roomStatus !== "playing") {
            return;
        }

        const state =
            currentRoom.state as unknown as LobbyRoomState;

        const roomCode = urlCode || state.roomCode || "";

        router.replace(
            `/game?code=${encodeURIComponent(roomCode)}`
        );
    }, [room, roomStatus, router, urlCode]);

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

    const state = room.state as unknown as LobbyRoomState;
    const roomCode = urlCode || state.roomCode || "";

    
const effectiveHostId = hostId || hostSessionId || "";

const isHost =
    Boolean(room.sessionId) &&
    Boolean(effectiveHostId) &&
    effectiveHostId === room.sessionId;

console.log("[LOBBY] Host debug:", {
    mySessionId: room.sessionId,
    stateHostId: state.hostId,
    storeHostSessionId: hostSessionId,
    effectiveHostId,
    isHost,
});

    
    const isWaiting = roomStatus === "waiting";

    // ========================================================
    // LEAVE ROOM
    // ========================================================


async function leaveRoom() {
    const currentRoom = room;

    // Xóa room khỏi store và thoát lobby ngay.
    clearRoom();
    router.replace("/multiplayer");

    if (!currentRoom) return;

    try {
        await currentRoom.leave();
    } catch (error) {
        console.warn(
            "[LOBBY] Room leave skipped or failed:",
            error,
        );
    }
}


    // ========================================================
    // START GAME
    // ========================================================

    function startGame() {
        const currentRoom = room;

        if (
            !currentRoom ||
            !isHost ||
            !isWaiting ||
            starting
        ) {
            return;
        }

        setStarting(true);
        setMessage("");

        try {
            currentRoom.send("startGame");
        } catch (error) {
            console.error("[LOBBY] Start game error:", error);

            setStarting(false);
            setMessage(
                "Không thể gửi yêu cầu bắt đầu trận đấu."
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
                "Không thể sao chép mã. Hãy sao chép thủ công."
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

                    <div className="lobby-connection">
                        <span className="lobby-online-dot" />
                        ĐÃ KẾT NỐI
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
                        Tập hợp đồng đội. Chuẩn bị bước vào bệnh viện ma ám.
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
                        {copied ? "Đã sao chép" : "Sao chép mã"}
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
                                        key={player.id}
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

{isHost ? (
    <>
        <p className="lobby-start-hint">
            Bạn có thể bắt đầu ngay, kể cả khi chơi một mình.
        </p>

        <button
            type="button"
            className="lobby-start-button"
            onClick={startGame}
            disabled={!isWaiting || starting}
        >
            {starting ? "ĐANG BẮT ĐẦU..." : "BẮT ĐẦU TRẬN"}
            <span aria-hidden="true">→</span>
        </button>
    </>
) : (
    <div className="lobby-waiting-box">
        <span className="lobby-pulse-dot" />

        <div>
            <strong>Đang chờ chủ phòng</strong>
            <p>Chủ phòng sẽ quyết định khi nào bắt đầu trận đấu.</p>
        </div>
    </div>
)}


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
