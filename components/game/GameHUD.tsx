"use client";

export default function GameHUD() {
return (
<div
style={{
position: "absolute",
inset: 0,
pointerEvents: "none",
color: "white",
fontFamily: "Arial, sans-serif",
}}
>
{/* Top left */}
<div
style={{
position: "absolute",
top: 18,
left: 18,
display: "flex",
flexDirection: "column",
gap: 8,
}}
>
<div
style={{
fontSize: 18,
fontWeight: 700,
}}
>
BOOM </div>

            <div
                style={{
                    background: "rgba(0,0,0,.45)",
                    padding: "6px 10px",
                    borderRadius: 8,
                }}
            >
                👥 1 / 10
            </div>
        </div>

        {/* HP */}
        <div
            style={{
                position: "absolute",
                left: 18,
                bottom: 30,
                width: 180,
            }}
        >
            <div
                style={{
                    fontSize: 13,
                    marginBottom: 5,
                }}
            >
                HP 100
            </div>

            <div
                style={{
                    height: 12,
                    background: "rgba(0,0,0,.6)",
                    borderRadius: 8,
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        background: "#22c55e",
                    }}
                />
            </div>
        </div>

        {/* Crosshair */}
        <div
            style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                fontSize: 28,
                opacity: 0.8,
            }}
        >
            +
        </div>

        {/* Weapon */}
        <div
            style={{
                position: "absolute",
                right: 20,
                bottom: 30,
                textAlign: "right",
            }}
        >
            <div
                style={{
                    fontSize: 16,
                    opacity: 0.8,
                }}
            >
                ASSAULT RIFLE
            </div>

            <div
                style={{
                    fontSize: 30,
                    fontWeight: 700,
                }}
            >
                30 / 120
            </div>
        </div>

        {/* Safe zone */}
        <div
            style={{
                position: "absolute",
                top: 18,
                right: 18,
                background: "rgba(0,0,0,.45)",
                padding: "8px 12px",
                borderRadius: 8,
                fontSize: 13,
            }}
        >
            SAFE ZONE
            <br />
            02:59
        </div>
    </div>
);


}
