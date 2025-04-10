import { useEffect, useState } from "react";
import UpcomingEvents from "../components/UpcomingEvents";
import WeeklyCalendar from "../components/WeeklyCalender";
import { loadSchedule } from "../utils/scheduleStorage";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import DashboardHeader from "../components/DashboardHeader";

import StartIcon from "../assets/images/icons/play.svg?react";
import StopIcon from "../assets/images/icons/stop.svg?react";
import FullScreenIcon from "../assets/images/icons/fullscreen.svg?react";
import RestartIcon from "../assets/images/icons/restart.svg?react";

function Dashboard() {
  const [events] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [time, setTime] = useState(1 * 60);
  const [initialTime, setInitialTime] = useState(1 * 60);
  const [rotateRestart, setRotateRestart] = useState(false);

  const [hours, setHours] = useState("00");
const [minutes, setMinutes] = useState("00");
const [seconds, setSeconds] = useState("00");

const progressWidth = initialTime > 0 ? (time / initialTime) * 100 : 0;



const inputStyle = {
  width: "30px",
  textAlign: "center" as const,
  fontWeight: "bold",
  border: "none",
  outline: "none",
  background: "transparent",
  color: "#1F0741", // purple color
  fontSize: "inherit",
};

  
  
  const [isRunning, setIsRunning] = useState(false);
  const [streak, setStreak] = useState(1);
  const navigate = useNavigate();

  const userId = "demoUser"; // Replace with actual logged-in user ID later

  useEffect(() => {
    if (rotateRestart) {
      const timeout = setTimeout(() => setRotateRestart(false), 500); // reset after 0.5s
      return () => clearTimeout(timeout);
    }
  }, [rotateRestart]);
  

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
      <DashboardHeader />


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
  display: "flex",
  alignItems: "center",
  border: "3px solid #1F0741",
  borderRadius: "12px",
  overflow: "hidden",
  height: "45px",
  width: "100%",
  backgroundColor: "#FFFBF1",
}}>
  {/* Timer and progress area */}
  <div style={{
    position: "relative",
    flexGrow: 1,
    height: "100%",
    backgroundColor: "#FFFBF1",
  }}>
{/* Progress Bar */}
<div style={{
  backgroundColor: "#FFB800",
  width: `${progressWidth}%`,
  transition: "width 1s linear",
  height: "100%",
  position: "absolute",
  top: 0,
  left: 0,
  zIndex: 0,
}} />


    {/* Timer Text */}
   {/* Timer Text or Input */}
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
    gap: "5px",
  }}
>
{!isRunning ? (
  <>
    <input
      type="number"
      min="0"
      max="99"
      value={hours}
      onChange={(e) => {
        const val = e.target.value.padStart(2, "0").slice(-2);
        setHours(val);
      }}
      style={inputStyle}
    />
    <span>h</span>
    <input
      type="number"
      min="0"
      max="59"
      value={minutes}
      onChange={(e) => {
        const val = e.target.value.padStart(2, "0").slice(-2);
        setMinutes(val);
      }}
      style={inputStyle}
    />
    <span>m</span>
    <input
      type="number"
      min="0"
      max="59"
      value={seconds}
      onChange={(e) => {
        const val = e.target.value.padStart(2, "0").slice(-2);
        setSeconds(val);
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

  {/* Divider */}
  <div style={{
    height: "100%",
    width: "2px",
    backgroundColor: "#1F0741",
  }} />

  {/* Buttons */}
  <div style={{
    display: "flex",
    alignItems: "center",
    padding: "0 12px",
    gap: "10px",
    backgroundColor: "#FFFBF1",
  }}>
{isRunning ? (
  <StopIcon
    style={{ width: "25px", height: "25px", cursor: "pointer" }}
    onClick={() => setIsRunning(false)}
  />
) : (
<StartIcon
  style={{ width: "25px", height: "25px", cursor: "pointer" }}
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
    const newTime = 60; // or use your logic
    setTime(newTime);
    setInitialTime(newTime);
    setRotateRestart(true); // 🔁 trigger animation
  }}
/>

    <FullScreenIcon style={{ width: "25px", height: "25px", cursor: "pointer" }} onClick={() => document.documentElement.requestFullscreen()} />
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
