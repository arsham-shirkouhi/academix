import { useState, useEffect } from "react";
import { saveSchedule, loadSchedule } from "../utils/scheduleStorage";
import { useNavigate } from "react-router-dom";

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
    const saved = loadSchedule();
    setSchedule(saved);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewClass((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddClass = () => {
    const updated = [...schedule, newClass];
    setSchedule(updated);
    saveSchedule(updated);
    setNewClass({
      id: crypto.randomUUID(),
      name: "",
      day: "Monday",
      startTime: "",
      endTime: "",
      location: "",
    });
  };

  const handleDelete = (id: string) => {
    const filtered = schedule.filter((cls) => cls.id !== id);
    setSchedule(filtered);
    saveSchedule(filtered);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>📚 Plan Your Weekly Schedule</h2>

      {/* Form */}
      <div style={{ marginTop: "1rem", marginBottom: "2rem", display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: "400px" }}>
        <input
          type="text"
          name="name"
          placeholder="Class Name (e.g. CS46B)"
          value={newClass.name}
          onChange={handleChange}
        />
        <select name="day" value={newClass.day} onChange={handleChange}>
          {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => (
            <option key={day}>{day}</option>
          ))}
        </select>
        <input type="time" name="startTime" value={newClass.startTime} onChange={handleChange} />
        <input type="time" name="endTime" value={newClass.endTime} onChange={handleChange} />
        <input
          type="text"
          name="location"
          placeholder="Location"
          value={newClass.location}
          onChange={handleChange}
        />
        <button onClick={handleAddClass}>Add Class</button>
      </div>

      {/* Current Schedule */}
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
