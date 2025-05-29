import { useEffect, useState } from "react";
import UpcomingEvents from "../components/UpcomingEvents";
import WeeklyCalendar from "../components/WeeklyCalender";
import TodoList from "../components/TodoList";
// import { loadSchedule } from "../utils/scheduleStorage";
// import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import GpaTracker from "../components/GpaTracker";

import { db } from "../firebase";
import DashboardHeader from "../components/DashboardHeader";
import { auth } from "../firebase";

import StartIcon from "../assets/images/icons/play.svg?react";
import StopIcon from "../assets/images/icons/stop.svg?react";
import FullScreenIcon from "../assets/images/icons/fullscreen.svg?react";
import RestartIcon from "../assets/images/icons/restart.svg?react";
import StreakIcon from "../assets/images/icons/streak.svg?react";

function Dashboard() {
  const [time, setTime] = useState(90 * 60); // 90 minutes in seconds
  const [initialTime, setInitialTime] = useState(90 * 60);
  const [rotateRestart, setRotateRestart] = useState(false);
  const [loading, setLoading] = useState(true);

  const [hours, setHours] = useState("01");
  const [minutes, setMinutes] = useState("30");
  const [seconds, setSeconds] = useState("00");

  const progressWidth = initialTime > 0 ? (time / initialTime) * 100 : 0;

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

  const [isRunning, setIsRunning] = useState(false);
  const [streak, setStreak] = useState(1);
  const [showFullscreenTimer, setShowFullscreenTimer] = useState(false);

  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (rotateRestart) {
      const timeout = setTimeout(() => setRotateRestart(false), 500);
      return () => clearTimeout(timeout);
    }
  }, [rotateRestart]);

  useEffect(() => {
    const today = new Date().toDateString();

    const fetchStreak = async () => {
      if (!userId) return;

      const docRef = doc(db, "users", userId);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data();
        const lastUsedDate = data.lastUsedDate;
        const storedStreak = data.studyStreak || 0;

        // Convert dates for comparison
        const lastLoginDate = new Date(lastUsedDate);
        const currentDate = new Date();
        const timeDifference = currentDate.getTime() - lastLoginDate.getTime();
        const hoursDifference = timeDifference / (1000 * 60 * 60);

        // If more than 24 hours have passed, reset streak to 0
        if (hoursDifference > 24) {
          await setDoc(
            docRef,
            {
              lastUsedDate: today,
              studyStreak: 0
            },
            { merge: true }
          );
          setStreak(0);
        }
        // If it's a new day but within 24 hours, increment streak
        else if (lastUsedDate !== today) {
          await setDoc(
            docRef,
            {
              lastUsedDate: today,
              studyStreak: storedStreak + 1
            },
            { merge: true }
          );
          setStreak(storedStreak + 1);
        }
        // If same day, keep current streak
        else {
          setStreak(storedStreak);
        }
      } else {
        // First time user starts with streak of 0
        await setDoc(docRef, {
          lastUsedDate: today,
          studyStreak: 0
        });
        setStreak(0);
      }
    };

    fetchStreak();
  }, [userId]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    if (isRunning && time > 0) {
      interval = setInterval(() => setTime((t) => t - 1), 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, time]);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

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
    <div
      style={{
        padding: "15px",
        fontSize: "16px",
        color: "#1F0741",
        display: "flex",
        flexDirection: "column",
        height: "100vh", // Full screen height
        boxSizing: "border-box",
      }}
    >
      {/* Welcome Header */}
      <DashboardHeader />
      <div
        style={{
          borderTop: "3px dashed #1F0741",
          width: "100%",
          margin: "1rem 0",
        }}
      />

      {/* Study Streak + Timer Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "1rem",
        }}
      >
        <div
          style={{
            border: "3px solid #1F0741",
            borderRadius: "12px",
            padding: "10px 10px",
            backgroundColor: "#FFFBF1",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            width: "270px",
            height: "45px",
          }}
        >
          <StreakIcon
            style={{ width: "30px", height: "30px", cursor: "pointer" }}
          />
          <span>
            Study Streak:{" "}
            <span style={{ color: "orange" }}>{streak} days</span>
          </span>
        </div>

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
                  const h = parseInt(hours) || 0;
                  const m = parseInt(minutes) || 0;
                  const s = parseInt(seconds) || 0;
                  const total = h * 3600 + m * 60 + s;

                  if (total > 0) {
                    setTime(total);
                    setInitialTime(total);
                    setIsRunning(true);
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
                const newTime = 60;
                setTime(newTime);
                setInitialTime(newTime);
                setRotateRestart(true);
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
      </div>
      <style>
        {`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}
      </style>

      {/* SCROLLABLE MAIN GRID */}
      <div
        className="no-scrollbar"
        style={{
          flexGrow: 1,
          overflowY: "auto",
          paddingBottom: "25px",
          maxWidth: "calc(100vw - 250px)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "12px",
            maxWidth: "calc(100vw - 250px)",
            height: "100%"
          }}
        >
          {/* First Row: Schedule, Upcoming, Todo */}
          {/* Schedule */}
          <div style={{ gridColumn: "span 1", height: "100%" }}>
            <div
              style={{
                border: "3px solid #1F0741",
                borderRadius: "16px",
                overflow: "hidden",
                backgroundColor: "#FFFBF1",
                height: "100%",
                display: "flex",
                flexDirection: "column"
              }}
            >
              <div
                style={{
                  backgroundColor: "#1F0741",
                  color: "#FFFBF1",
                  padding: "0.75rem 1rem",
                  fontSize: "24px",
                  fontWeight: "bold",
                }}
              >
                Schedule
              </div>
              <div
                className="no-scrollbar"
                style={{
                  padding: "15px",
                  flex: 1,
                  overflowY: "auto"
                }}
              >
                <WeeklyCalendar limitToTodayAndTomorrow />
              </div>
            </div>
          </div>

          {/* Upcoming */}
          <div style={{ gridColumn: "span 1", height: "100%" }}>
            <div
              style={{
                border: "3px solid #1F0741",
                borderRadius: "16px",
                overflow: "hidden",
                backgroundColor: "#FFFBF1",
                height: "100%",
                display: "flex",
                flexDirection: "column"
              }}
            >
              <div
                style={{
                  backgroundColor: "#1F0741",
                  color: "#FFFBF1",
                  padding: "0.75rem 1rem",
                  fontSize: "24px",
                  fontWeight: "bold",
                }}
              >
                Upcoming
              </div>
              <div
                className="no-scrollbar"
                style={{
                  backgroundColor: "#FFFBF1",
                  padding: "15px",
                  flex: 1,
                  overflowY: "auto"
                }}
              >
                <UpcomingEvents />
              </div>
            </div>
          </div>

          {/* Todo */}
          <div style={{ gridColumn: "span 1", height: "100%" }}>
            <div
              style={{
                border: "3px solid #1F0741",
                borderRadius: "16px",
                overflow: "hidden",
                backgroundColor: "#FFFBF1",
                height: "100%",
                display: "flex",
                flexDirection: "column"
              }}
            >
              <div
                style={{
                  backgroundColor: "#1F0741",
                  color: "#FFFBF1",
                  padding: "0.75rem 1rem",
                  fontSize: "24px",
                  fontWeight: "bold",
                }}
              >
                To-Do
              </div>
              <div
                className="no-scrollbar"
                style={{
                  backgroundColor: "#FFFBF1",
                  padding: "15px",
                  flex: 1,
                  overflowY: "auto"
                }}
              >
                <div style={{ flex: 1 }}>
                  {loading ? (
                    <div>
                      {[1, 2, 3].map((_, index) => (
                        <div
                          key={index}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "8px 0",
                            opacity: 0,
                            animation: `fadeInUp 0.5s ease forwards ${index * 0.1}s`
                          }}
                        >
                          <div
                            style={{
                              width: "18px",
                              height: "18px",
                              borderRadius: "6px",
                              background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
                              backgroundSize: "200% 100%",
                              animation: "shimmer 2s infinite"
                            }}
                          />
                          <div
                            style={{
                              flex: 1,
                              height: "18px",
                              borderRadius: "4px",
                              background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
                              backgroundSize: "200% 100%",
                              animation: "shimmer 2s infinite"
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <TodoList />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Second Row: This Week and Grade Overview */}
          {/* This Week - Temporarily commented out
          <div style={{ gridColumn: "span 2", height: "auto" }}>
            <div
              style={{
                border: "3px solid #1F0741",
                borderRadius: "16px",
                overflow: "hidden",
                backgroundColor: "#FFFBF1",
                height: "100%"
              }}
            >
              <div
                style={{
                  backgroundColor: "#1F0741",
                  color: "#FFFBF1",
                  padding: "0.75rem 1rem",
                  fontSize: "24px",
                  fontWeight: "bold",
                }}
              >
                This Week
              </div>
              <div
                className="no-scrollbar"
                style={{
                  backgroundColor: "#FFFBF1",
                  padding: "15px",
                }}
              >
                <p style={{ margin: "0.25rem 0", lineHeight: "1.5", fontSize: "14px" }}>🕒 Study Time: <strong>2h 30m</strong></p>
                <p style={{ margin: "0.25rem 0", lineHeight: "1.5", fontSize: "14px" }}>✅ Assignments: <strong>2 done</strong></p>
                <p style={{ margin: "0.25rem 0", lineHeight: "1.5", fontSize: "14px" }}>📋 Tasks Done: <strong>3/5</strong></p>
              </div>
            </div>
          </div>
          */}

          {/* Grade Overview */}
          <div style={{ gridColumn: "span 1", height: "100%" }}>
            <div
              style={{
                border: "3px solid #1F0741",
                borderRadius: "16px",
                overflow: "hidden",
                backgroundColor: "#FFFBF1",
                height: "100%",
                display: "flex",
                flexDirection: "column"
              }}
            >
              <div
                style={{
                  backgroundColor: "#1F0741",
                  color: "#FFFBF1",
                  padding: "0.75rem 1rem",
                  fontSize: "24px",
                  fontWeight: "bold",
                }}
              >
                Grade Overview
              </div>
              <div
                className="no-scrollbar"
                style={{
                  padding: "15px",
                  flex: 1,
                  overflowY: "auto"
                }}
              >
                <GpaTracker />
              </div>
            </div>
          </div>
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

export default Dashboard;
