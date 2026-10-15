
"use client";

import {
    useEffect,
    useRef,
    useState,
} from "react";

import "./JumpScareOverlay.css";

type JumpScareOverlayProps = {
    trigger: number;
    imageSrc?: string;
    audioSrc?: string;
    onComplete?: () => void;
};

export default function JumpScareOverlay({
    trigger,
    imageSrc = "/assets/horror/ghost.png",
    audioSrc = "/assets/horror/sound-jumpscale.mp3",
    onComplete,
}: JumpScareOverlayProps) {
    const [active, setActive] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const onCompleteRef = useRef(onComplete);

    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    useEffect(() => {
        if (trigger <= 0) return;

        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        setActive(true);

        let audio = audioRef.current;

        if (!audio) {
            audio = new Audio();
            audio.preload = "auto";
            audioRef.current = audio;
        }

        audio.pause();
        audio.src = audioSrc;
        audio.currentTime = 2.7;

        audio.volume = 1;

        console.log("[JUMPSCARE] Triggered");
        console.log("[JUMPSCARE] Audio URL:", audio.src);

        void audio.play()
            .then(() => {
                console.log("[JUMPSCARE] Audio playing");
            })
            .catch((error: unknown) => {
                console.error(
                    "[JUMPSCARE] Audio playback failed:",
                    error,
                    "URL:",
                    audio?.src
                );
            });

        timerRef.current = setTimeout(() => {
            setActive(false);
            onCompleteRef.current?.();
            timerRef.current = null;
        }, 2000);

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [trigger, audioSrc]);

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }

            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = "";
                audioRef.current = null;
            }
        };
    }, []);

    if (!active) return null;

    return (
        <div className="jump-scare-overlay" aria-hidden="true">
            <img
                key={trigger}
                className="jump-scare-ghost"
                src={imageSrc}
                alt=""
                draggable={false}
            />
        </div>
    );
}
