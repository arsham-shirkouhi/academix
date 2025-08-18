import { useState, useEffect } from "react";
import { auth } from "../firebase";
import { addStudyTime } from "../utils/firestoreUser";

import StartIcon from "../assets/images/icons/play.svg?react";
import StopIcon from "../assets/images/icons/stop.svg?react";
import FullScreenIcon from "../assets/images/icons/fullscreen.svg?react";
import RestartIcon from "../assets/images/icons/restart.svg?react";

function TimerWidget() {
    const [time, setTime] = useState(90 * 60); // 90 minutes in seconds
    const [initialTime, setInitialTime] = useState(90 * 60);
    const [rotateRestart, setRotateRestart] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [showFullscreenTimer, setShowFullscreenTimer] = useState(false);
    const [hours, setHours] = useState("01");
    const [minutes, setMinutes] = useState("30");
    const [seconds, setSeconds] = useState("00");

    // Update input fields when timer is paused to show current time
    useEffect(() => {
        if (!isRunning && time > 0) {
            const h = Math.floor(time / 3600);
            const m = Math.floor((time % 3600) / 60);
            const s = time % 60;
            setHours(String(h).padStart(2, "0"));
            setMinutes(String(m).padStart(2, "0"));
            setSeconds(String(s).padStart(2, "0"));
        }
    }, [isRunning, time]);

    const progressWidth = initialTime > 0 ? (time / initialTime) * 100 : 0;
    const userId = auth.currentUser?.uid;

    const inputStyle: React.CSSProperties = {
        width: "2ch",
        textAlign: "right",
        fontWeight: "bold",
        border: "none",
        outline: "none",
        background: "transparent",
        color: "#1F0741",
        fontSize: "inherit",
        appearance: "none",
        MozAppearance: "textfield",
        WebkitAppearance: "none",
        padding: 0,
        margin: 0,
        overflowY: "hidden",
    };

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | undefined;

        if (isRunning && time > 0) {
            interval = setInterval(() => {
                setTime((t) => {
                    if (t <= 1) {
                        // Timer completed - add study time
                        if (userId && initialTime > 0) {
                            addStudyTime(userId, initialTime);
                        }
                        setIsRunning(false);
                        return 0;
                    }
                    return t - 1;
                });
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRunning, userId, initialTime]);

    // Reset rotate animation
    useEffect(() => {
        if (rotateRestart) {
            const timer = setTimeout(() => setRotateRestart(false), 500);
            return () => clearTimeout(timer);
        }
    }, [rotateRestart]);

    const formatTime = (sec: number) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        return `${String(h).padStart(2, "0")}h ${String(m).padStart(
            2,
            "0"
        )}m ${String(s).padStart(2, "0")}s left`;
    };

    return (
        <div style={{ flex: 1 }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    border: "3px solid #1F0741",
                    borderRadius: "12px",
                    overflow: "hidden",
                    height: "45px",
                    width: "100%",
                    backgroundColor: "#FFFBF1",
                }}
            >
                <div
                    style={{
                        position: "relative",
                        flexGrow: 1,
                        height: "100%",
                        backgroundColor: "#FFFBF1",
                    }}
                >
                    {!showFullscreenTimer && (
                        <div
                            style={{
                                backgroundColor: "#FFB800",
                                width: `${progressWidth}%`,
                                transition: "width 1s linear",
                                height: "100%",
                                position: "absolute",
                                top: 0,
                                left: 0,
                                zIndex: 0,
                            }}
                        />
                    )}

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            paddingLeft: "16px",
                            fontWeight: "bold",
                            color: "#1F0741",
                            lineHeight: "40px",
                            fontSize: "inherit",
                            position: "relative",
                            zIndex: 1,
                            gap: "0.25ch",
                        }}
                    >
                        {!isRunning ? (
                            <>
                                <input
                                    type="text"
                                    value={hours}
                                    inputMode="numeric"
                                    onChange={(e) => {
                                        const raw = e.target.value.replace(/\D/g, "");
                                        setHours(raw.padStart(2, "0").slice(-2));
                                    }}
                                    style={inputStyle}
                                />
                                <span>h</span>
                                <input
                                    type="text"
                                    value={minutes}
                                    inputMode="numeric"
                                    onChange={(e) => {
                                        const raw = e.target.value.replace(/\D/g, "");
                                        setMinutes(raw.padStart(2, "0").slice(-2));
                                    }}
                                    style={inputStyle}
                                />
                                <span>m</span>
                                <input
                                    type="text"
                                    value={seconds}
                                    inputMode="numeric"
                                    onChange={(e) => {
                                        const raw = e.target.value.replace(/\D/g, "");
                                        setSeconds(raw.padStart(2, "0").slice(-2));
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            (e.target as HTMLInputElement).blur();
                                        }
                                    }}
                                    style={inputStyle}
                                />
                                <span>s left</span>
                            </>
                        ) : (
                            <span>{formatTime(time)}</span>
                        )}
                    </div>
                </div>

                <div
                    style={{
                        height: "100%",
                        width: "2px",
                        backgroundColor: "#1F0741",
                    }}
                />

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "0 12px",
                        gap: "10px",
                        backgroundColor: "#FFFBF1",
                    }}
                >
                    {isRunning ? (
                        <StopIcon
                            style={{ width: "25px", height: "25px", cursor: "pointer" }}
                            onClick={() => setIsRunning(false)}
                        />
                    ) : (
                        <StartIcon
                            style={{
                                width: "25px",
                                height: "25px",
                                cursor: "pointer",
                            }}
                            onClick={() => {
                                // If timer was already set, just resume from current time
                                if (time > 0) {
                                    setIsRunning(true);
                                } else {
                                    // Only set new time if timer is at 0
                                    const h = parseInt(hours) || 0;
                                    const m = parseInt(minutes) || 0;
                                    const s = parseInt(seconds) || 0;
                                    const total = h * 3600 + m * 60 + s;

                                    if (total > 0) {
                                        setTime(total);
                                        setInitialTime(total);
                                        setIsRunning(true);
                                    }
                                }
                            }}
                        />
                    )}

                    <RestartIcon
                        style={{
                            width: "25px",
                            height: "25px",
                            cursor: "pointer",
                            transition: "transform 0.5s ease",
                            transform: rotateRestart ? "rotate(360deg)" : "none",
                        }}
                        onClick={() => {
                            const newTime = 90 * 60; // 1 hour 30 minutes
                            setTime(newTime);
                            setInitialTime(newTime);
                            setIsRunning(false);
                            setRotateRestart(true);
                            setTimeout(() => setRotateRestart(false), 500);
                        }}
                    />

                    <FullScreenIcon
                        style={{
                            width: "25px",
                            height: "25px",
                            cursor: "pointer",
                        }}
                        onClick={() => setShowFullscreenTimer(true)}
                    />
                </div>
            </div>

            {/* Fullscreen Timer */}
            {showFullscreenTimer && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100vw",
                        height: "100vh",
                        backgroundColor: "#FFFBF1",
                        color: "#1F0741",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 9999,
                        flexDirection: "column",
                        cursor: "pointer",
                    }}
                    onClick={() => setShowFullscreenTimer(false)}
                >
                    {/* Progress Bar */}
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            height: "100%",
                            backgroundColor: "#FFB800",
                            transition: "width 1s linear",
                            width: `${progressWidth}%`,
                            zIndex: -1,
                        }}
                    />
                    <span
                        style={{
                            fontSize: "8rem",
                            fontWeight: "bold",
                            position: "relative",
                            zIndex: 1,
                            color: "#FFFBF1",
                        }}
                    >
                        {formatTime(time).replace(" left", "")}
                    </span>
                    <p
                        style={{
                            marginTop: "1rem",
                            fontSize: "1.5rem",
                            position: "relative",
                            zIndex: 1,
                            color: "#FFFBF1",
                        }}
                    >
                        Click anywhere to exit
                    </p>
                </div>
            )}
        </div>
    );
}

export default TimerWidget;
