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

function Planner() {
  const [schedule, setSchedule] = useState<ClassEntry[]>([]);
  const [courseNames, setCourseNames] = useState<string[]>([]);
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
            headers: {
              Authorization: `Bearer ${settings.token}`,
            },
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

    setNewClass({
      id: crypto.randomUUID(),
      name: "",
      day: "Monday",
      startTime: "",
      endTime: "",
      location: "",
    });
  };

  const handleDelete = async (id: string) => {
    const filtered = schedule.filter((cls) => cls.id !== id);
    setSchedule(filtered);
    const user = auth.currentUser;
    if (user) await saveUserSchedule(user.uid, filtered);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>📚 Plan Your Weekly Schedule</h2>

      {/* Form */}
      <div style={{ marginTop: "1rem", marginBottom: "2rem", display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: "400px" }}>
        <input
          type="text"
          name="name"
          list="course-options"
          placeholder="Class Name (e.g. CS46B)"
          value={newClass.name}
          onChange={handleChange}
        />
        <datalist id="course-options">
          {courseNames.map((name, i) => (
            <option key={i} value={name} />
          ))}
        </datalist>

        <select name="day" value={newClass.day} onChange={handleChange}>
          {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => (
            <option key={day}>{day}</option>
          ))}
        </select>

        <input type="time" name="startTime" value={newClass.startTime} onChange={handleChange} />
        <input type="time" name="endTime" value={newClass.endTime} onChange={handleChange} />
        <input type="text" name="location" placeholder="Location" value={newClass.location} onChange={handleChange} />
        <button onClick={handleAddClass}>Add Class</button>
      </div>

      {/* Display Schedule */}
      <h3>🗓️ Current Schedule</h3>
      {schedule.length === 0 ? (
        <p>No classes added yet.</p>
      ) : (
        <ul>
          {schedule.map((cls) => (
            <li key={cls.id}>
              <strong>{cls.name}</strong> – {cls.day} @ {cls.startTime}–{cls.endTime} ({cls.location})
              <button onClick={() => handleDelete(cls.id)} style={{ marginLeft: "1rem" }}>❌</button>
            </li>
          ))}
        </ul>
      )}

      <br />
      <button onClick={() => navigate("/")}>⬅️ Back to Dashboard</button>
    </div>
  );
}

export default Planner;
