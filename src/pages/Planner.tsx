import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { saveUserSchedule, loadUserSchedule, getUserSettings } from "../utils/firestoreUser";

type ClassEntry = {
  id: string;
  name: string;
  day: string;
  startTime: string;
  endTime: string;
  location: string;
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const HOURS = Array.from({ length: 12 }, (_, i) => `${8 + i}:00`);

function Planner() {
  const [schedule, setSchedule] = useState<ClassEntry[]>([]);
  const [courseNames, setCourseNames] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newClass, setNewClass] = useState<ClassEntry>({
    id: crypto.randomUUID(),
    name: "",
    day: "Monday",
    startTime: "",
    endTime: "",
    location: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchScheduleAndCourses = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const [stored, settings] = await Promise.all([
        loadUserSchedule(user.uid),
        getUserSettings(user.uid)
      ]);

      setSchedule(stored);

      if (settings?.token && settings?.domain) {
        const cleanDomain = settings.domain.replace(/^https?:\/\//, "");
        try {
          const res = await fetch(`https://${cleanDomain}/api/v1/courses`, {
            headers: { Authorization: `Bearer ${settings.token}` }
          });
          const courses = await res.json();
          const names = courses.map((c: any) => {
            const full = c.name || "";
            const parts = full.split(" - ");
            return parts.length > 1 ? parts.slice(1).join(" - ").trim() : full;
          });
          setCourseNames(names);
        } catch (err) {
          console.error("❌ Failed to fetch courses:", err);
        }
      }
    };

    fetchScheduleAndCourses();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewClass((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddClass = async () => {
    const updated = [...schedule, newClass];
    setSchedule(updated);
    const user = auth.currentUser;
    if (user) await saveUserSchedule(user.uid, updated);
    setShowForm(false);
    setNewClass({
      id: crypto.randomUUID(),
      name: "",
      day: "Monday",
      startTime: "",
      endTime: "",
      location: "",
    });
  };

  const renderEvents = (day: string) => {
    const eventsForDay = schedule.filter((cls) => cls.day === day);
    return eventsForDay.map((cls) => {
      const top = (parseInt(cls.startTime.split(":")[0]) - 8) * 60;
      const height = (parseInt(cls.endTime.split(":")[0]) - parseInt(cls.startTime.split(":")[0])) * 60;

      return (
        <div
          key={cls.id}
          style={{
            position: "absolute",
            top: `${top}px`,
            height: `${height}px`,
            left: "5%",
            width: "90%",
            background: "#1f0741",
            color: "#fff",
            borderRadius: "6px",
            padding: "4px",
            fontSize: "12px",
            zIndex: 10,
            border: "2px solid #fff",
          }}
        >
          <strong>{cls.name}</strong><br />
          {cls.startTime}–{cls.endTime}<br />
          {cls.location}
        </div>
      );
    });
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Weekly Planner</h2>

      <div style={{ border: "3px solid #1f0741", borderRadius: "12px", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "flex", background: "#ffb703", fontWeight: "bold" }}>
          <div style={{ width: "60px" }} />
          {DAYS.map((day) => (
            <div key={day} style={{ flex: 1, textAlign: "center", padding: "8px", borderLeft: "1px solid #1f0741" }}>
              {day}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: "flex" }}>
          {/* Time slots */}
          <div style={{ display: "flex", flexDirection: "column", width: "60px" }}>
            {HOURS.map((hour) => (
              <div key={hour} style={{ height: "30px", padding: "4px", fontSize: "12px", color: "#666", borderTop: "1px solid #ddd" }}>
                {hour}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {DAYS.map((day) => (
            <div key={day} style={{ flex: 1, borderLeft: "1px solid #ddd", position: "relative" }}>
              {renderEvents(day)}
            </div>
          ))}
        </div>
      </div>

      {/* Floating + Button */}
      <button
        onClick={() => setShowForm(true)}
        style={{
          position: "fixed",
          bottom: "2rem",
          right: "2rem",
          width: "60px",
          height: "60px",
          fontSize: "32px",
          borderRadius: "50%",
          background: "#ffb703",
          color: "#1f0741",
          border: "3px solid #1f0741",
          cursor: "pointer"
        }}
      >
        ＋
      </button>

      {/* Modal Form */}
      {showForm && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.3)",
          display: "flex", justifyContent: "center", alignItems: "center"
        }}>
          <div style={{
            background: "#fff",
            padding: "2rem",
            borderRadius: "12px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
          }}>
            <h3>Add Class / Event</h3>
            <input
              type="text"
              name="name"
              list="course-options"
              placeholder="Class Name"
              value={newClass.name}
              onChange={handleChange}
              style={{ marginBottom: "0.5rem", width: "100%" }}
            />
            <datalist id="course-options">
              {courseNames.map((name, i) => <option key={i} value={name} />)}
            </datalist>
            <select name="day" value={newClass.day} onChange={handleChange} style={{ marginBottom: "0.5rem", width: "100%" }}>
              {DAYS.map((d) => <option key={d}>{d}</option>)}
            </select>
            <input type="time" name="startTime" value={newClass.startTime} onChange={handleChange} style={{ marginBottom: "0.5rem", width: "100%" }} />
            <input type="time" name="endTime" value={newClass.endTime} onChange={handleChange} style={{ marginBottom: "0.5rem", width: "100%" }} />
            <input type="text" name="location" value={newClass.location} onChange={handleChange} placeholder="Location" style={{ marginBottom: "0.5rem", width: "100%" }} />
            <div style={{ marginTop: "1rem" }}>
              <button onClick={handleAddClass}>✅ Add</button>
              <button onClick={() => setShowForm(false)} style={{ marginLeft: "1rem" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <button onClick={() => navigate("/")} style={{ marginTop: "2rem" }}>⬅️ Back to Dashboard</button>
    </div>
  );
}

export default Planner;
