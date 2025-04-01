import { useEffect, useState } from "react";
import UpcomingEvents from "../components/UpcomingEvents";
import WeeklyCalendar from "../components/WeeklyCalender";
import { loadSchedule } from "../utils/scheduleStorage";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [events] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = loadSchedule();
    setSchedule(saved);
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      {/* Welcome Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "2rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "42px", margin: 0 }}>Welcome back, Arsham!</h1>
          <p style={{ fontSize: "24px", marginTop: "0.25rem" }}>
            You have <strong>2 assignments</strong> due tomorrow and an <strong>exam</strong> in 3 days.{" "}
            <span style={{ color: "#2200ff", fontWeight: 600, cursor: "pointer" }}>view ➜</span>
          </p>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginBottom: "0.3rem" }}>
            <button
              style={{
                background: "transparent",
                border: "2px solid #1F0741",
                borderRadius: "8px",
                width: "36px",
                height: "36px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: "18px",
                color: "#1F0741",
                cursor: "pointer",
              }}
              title="Settings"
            >
              🔔
            </button>
          </div>
          <div style={{ fontSize: "0.95rem", color: "#1F0741" }}>
            3/15/2025
            <br />
            <span style={{ fontWeight: "bold" }}>week 7/15</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        {/* This Week Overview */}
        <div style={{ backgroundColor: "#FBF5E5", padding: "1rem", borderRadius: "8px" }}>
          <h3>This Week</h3>
          <p>🕒 Study Time: <strong>2h 30m</strong></p>
          <p>✅ Assignments: <strong>2 done</strong></p>
          <p>📋 Tasks Done: <strong>3/5</strong></p>
        </div>

        {schedule.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <button
              style={{
                padding: "1rem 2rem",
                backgroundColor: "#2200ff",
                color: "#FBF5E5",
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

        <UpcomingEvents events={events} />

        {/* To-Do List */}
        <div style={{ backgroundColor: "#FBF5E5", padding: "1rem", borderRadius: "8px" }}>
          <h3>To-Do</h3>
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
              color: "#FBF5E5",
              padding: "0.5rem 1rem",
              border: "none",
              borderRadius: "4px",
            }}
          >
            View To-Do’s
          </button>
        </div>

        {/* GPA Tracker */}
        <div style={{ backgroundColor: "#2e004f", padding: "1rem", borderRadius: "8px", color: "#FBF5E5" }}>
          <h3>Grade & GPA Tracker</h3>
          <p style={{ fontSize: "1.2rem", marginTop: "1rem" }}>GPA: 3.72 / 4.00</p>
          <div style={{ backgroundColor: "#555", height: "10px", borderRadius: "5px", marginTop: "0.5rem" }}>
            <div style={{ width: "93%", height: "100%", backgroundColor: "#6BCB77", borderRadius: "5px" }}></div>
          </div>
          <p style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>On track for Dean’s List! 🎓</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
