import { useEffect, useState } from "react";
import UpcomingEvents from "../components/UpcomingEvents";
import WeeklyCalendar from "../components/WeeklyCalender";
import { loadSchedule } from "../utils/scheduleStorage";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

function Dashboard() {
  const [events] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [time, setTime] = useState(90 * 60); // 1h 30m default
  const [isRunning, setIsRunning] = useState(false);
  const [streak, setStreak] = useState(1);
  const navigate = useNavigate();

  const userId = "demoUser"; // Replace with actual logged-in user ID later

  useEffect(() => {
    const today = new Date().toDateString();
    const fetchStreak = async () => {
      const docRef = doc(db, "users", userId);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data();
        const lastUsedDate = data.lastUsedDate;
        const storedStreak = data.studyStreak || 1;

        if (lastUsedDate !== today) {
          await setDoc(docRef, {
            lastUsedDate: today,
            studyStreak: storedStreak + 1
          }, { merge: true });
          setStreak(storedStreak + 1);
        } else {
          setStreak(storedStreak);
        }
      } else {
        await setDoc(docRef, {
          lastUsedDate: today,
          studyStreak: 1
        });
        setStreak(1);
      }
    };

    fetchStreak();
  }, []);

  useEffect(() => {
    const saved = loadSchedule();
    setSchedule(saved);
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    if (isRunning && time > 0) {
      interval = setInterval(() => setTime((t) => t - 1), 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, time]);

  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s left`;
  };

  return (
    <div style={{ padding: "15px", fontSize: "16px", color: "#1F0741" }}>
      {/* Welcome Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "42px", margin: 0 }}>Welcome back, Arsham!</h1>
          <p style={{ fontSize: "24px", marginTop: "0.25rem" }}>
            {(() => {
              const today = new Date();
              let dueTomorrowCount = 0;
              let nextExamInDays: number | null = null;
              const examDays: number[] = [];

              events.forEach((event) => {
                const rawDate = event.due_at || event.start_at;
                if (!rawDate) return;
                const eventDate = new Date(rawDate);
                const diff = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                if (diff === 1) dueTomorrowCount++;
                const title = event.title.toLowerCase();
                if (["exam", "quiz", "midterm", "test"].some((word) => title.includes(word))) {
                  if (diff >= 0) examDays.push(diff);
                }
              });

              nextExamInDays = examDays.length > 0 ? Math.min(...examDays) : null;
              return (
                <>
                  You have <strong>{dueTomorrowCount}</strong> assignment{dueTomorrowCount !== 1 && "s"} due tomorrow
                  {nextExamInDays !== null && (
                    <> and an <strong>exam</strong> in {nextExamInDays} day{nextExamInDays !== 1 && "s"}</>
                  )}
                  <span style={{ color: "#1F0741", fontWeight: 600, cursor: "pointer" }}> view ➜</span>
                </>
              );
            })()}
          </p>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginBottom: "0.3rem" }}>
            <button style={{
              background: "transparent", border: "2px solid #1F0741", borderRadius: "8px",
              width: "36px", height: "36px", display: "flex", justifyContent: "center",
              alignItems: "center", fontSize: "18px", color: "#1F0741", cursor: "pointer",
            }} title="Settings">
              <img src="/icons/bell.svg" alt="bell" style={{ width: "20px" }} />
            </button>
          </div>
          <div style={{ fontSize: "0.95rem" }}>
            3/15/2025 <br />
            <span style={{ fontWeight: "bold" }}>week 7/15</span>
          </div>
        </div>
      </div>

      {/* Study Streak + Timer Bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "2rem" }}>
        <div style={{
          border: "2px solid #1F0741",
          borderRadius: "12px",
          padding: "10px 16px",
          backgroundColor: "#FFFBF1",
          fontWeight: "bold",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}>
          <img src="/icons/fire.svg" alt="streak" style={{ width: "20px" }} />
          <span>Study Streak: <span style={{ color: "orange" }}>{streak} Days</span></span>
        </div>

        <div style={{
          flexGrow: 1,
          display: "flex",
          alignItems: "center",
          border: "2px solid #1F0741",
          borderRadius: "12px",
          overflow: "hidden",
          height: "40px",
          position: "relative",
          backgroundColor: "#FFFBF1",
        }}>
          <div style={{
            backgroundColor: "orange",
            width: `${(time / (90 * 60)) * 100}%`,
            height: "100%",
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: 0,
          }}></div>

          <div style={{
            position: "absolute",
            left: "16px",
            fontWeight: "bold",
            color: "#1F0741",
            zIndex: 1,
          }}>{formatTime(time)}</div>

          <div style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "0 10px",
            backgroundColor: "#FFFBF1",
            zIndex: 2,
          }}>
            <img src="./images/icons/play.svg" alt="start" style={{ width: "20px", cursor: "pointer" }} onClick={() => setIsRunning(true)} />
            <img src="./images/icons/stop.svg" alt="stop" style={{ width: "20px", cursor: "pointer" }} onClick={() => setIsRunning(false)} />
            <img src="./images/icons/restart.svg" alt="reset" style={{ width: "20px", cursor: "pointer" }} onClick={() => setTime(90 * 60)} />
            <img src="./images/icons/fullscreen.svg" alt="fullscreen" style={{ width: "20px", cursor: "pointer" }} onClick={() => document.documentElement.requestFullscreen()} />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gridAutoRows: "min-content",
        gap: "15px",
        alignItems: "start",
      }}>
        {/* This Week */}
        <div style={{ border: "3px solid #1F0741", borderRadius: "16px", overflow: "hidden" }}>
          <div style={{ backgroundColor: "#1F0741", color: "#FFFBF1", padding: "0.75rem 1rem", fontSize: "24px", fontWeight: "bold" }}>
            This Week
          </div>
          <div style={{ backgroundColor: "#FFFBF1", padding: "1rem" }}>
            <p>🕒 Study Time: <strong>2h 30m</strong></p>
            <p>✅ Assignments: <strong>2 done</strong></p>
            <p>📋 Tasks Done: <strong>3/5</strong></p>
          </div>
        </div>

        {/* Weekly Calendar */}
        {schedule.length === 0 ? (
          <div style={{
            border: "3px solid #1F0741",
            borderRadius: "16px",
            overflow: "hidden",
            backgroundColor: "#FFFBF1",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: "2rem"
          }}>
            <div style={{ backgroundColor: "#1F0741", color: "#FFFBF1", width: "100%", padding: "0.75rem 1rem", fontSize: "24px", fontWeight: "bold" }}>
              Schedule
            </div>
            <button
              style={{
                marginTop: "2rem",
                padding: "1rem 2rem",
                backgroundColor: "#2200ff",
                color: "#FFFBF1",
                fontSize: "1rem",
                borderRadius: "10px",
                border: "none",
                cursor: "pointer",
              }}
              onClick={() => navigate("/planner")}
            >
              ➕ Add Weekly Schedule
            </button>
          </div>
        ) : (
          <WeeklyCalendar events={schedule} />
        )}

        {/* Upcoming */}
        <div style={{ border: "3px solid #1F0741", borderRadius: "16px", overflow: "hidden" }}>
          <div style={{ backgroundColor: "#1F0741", color: "#FFFBF1", padding: "0.75rem 1rem", fontSize: "24px", fontWeight: "bold" }}>
            Upcoming
          </div>
          <div style={{ backgroundColor: "#FFFBF1", padding: "1rem" }}>
            <UpcomingEvents events={events} />
          </div>
        </div>

        {/* To-Do */}
        <div style={{ border: "3px solid #1F0741", borderRadius: "16px", overflow: "hidden" }}>
          <div style={{ backgroundColor: "#1F0741", color: "#FFFBF1", padding: "0.75rem 1rem", fontSize: "24px", fontWeight: "bold" }}>
            To-Do
          </div>
          <div style={{ backgroundColor: "#FFFBF1", padding: "1rem" }}>
            <ul>
              <li><input type="checkbox" /> physics homework</li>
              <li><input type="checkbox" /> math assignment</li>
              <li><input type="checkbox" /> cs zybook</li>
              <li><input type="checkbox" /> presentation slides</li>
            </ul>
            <button
              style={{
                marginTop: "1rem",
                backgroundColor: "orange",
                color: "#FFFBF1",
                padding: "0.5rem 1rem",
                border: "none",
                borderRadius: "4px",
              }}
            >
              View To-Do’s
            </button>
          </div>
        </div>

        {/* GPA Tracker */}
        {/* You can plug it back here when you resume GPA work */}

      </div>
    </div>
  );
}

export default Dashboard;
