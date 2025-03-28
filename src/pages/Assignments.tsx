import { useEffect, useState } from "react";
import { fetchUpcomingEvents } from "../utils/canvasApi";
import { loadSchedule } from "../utils/scheduleStorage";

function Assignments() {
  const [token, setToken] = useState(() => localStorage.getItem("canvasToken") || "");
  const [domain, setDomain] = useState(() => localStorage.getItem("canvasDomain") || "https://sjsu.instructure.com");
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    if (token && domain) {
      fetchUpcomingEvents(token, domain)
        .then((data) => setEvents(data))
        .catch((err) => console.error("Error fetching assignments:", err));
    }
  }, [token, domain]);

  const daysLeft = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getUrgencyColor = (days: number) => {
    if (days <= 1) return "#E63946"; // red
    if (days <= 2) return "#F4A261"; // orange
    if (days <= 4) return "#E9C46A"; // yellow
    return "#2A9D8F"; // green
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>📚 All Upcoming Assignments</h2>
      {events.length === 0 ? (
        <p>No upcoming assignments found.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {events
            .sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime())
            .map((event: any) => {
              const days = daysLeft(event.due_at);
              return (
                <li
                  key={event.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: "#f8f8f8",
                    padding: "1rem",
                    marginBottom: "1rem",
                    borderRadius: "8px",
                    borderLeft: `6px solid ${getUrgencyColor(days)}`,
                  }}
                >
                  <div>
                    <h4 style={{ margin: 0 }}>{event.title}</h4>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "#666" }}>
                      Due: {new Date(event.due_at).toLocaleString()}
                    </p>
                  </div>
                  <div style={{ fontWeight: "bold", color: "#333" }}>
                    in {days} day{days !== 1 ? "s" : ""}
                  </div>
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
}

export default Assignments;
