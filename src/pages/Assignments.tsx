// src/pages/Assignments.tsx

import { useEffect, useState } from "react";
import { fetchUpcomingEvents } from "../utils/canvasApi";

function Assignments() {
  const [events, setEvents] = useState<any[]>([]);
  const [token] = useState(() => localStorage.getItem("canvasToken") || "");
  const [domain] = useState(() => localStorage.getItem("canvasDomain") || "https://sjsu.instructure.com");
  
  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await fetchUpcomingEvents(token, domain);
        const sorted = data.sort((a: any, b: any) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime());
        setEvents(sorted);
      } catch (err) {
        console.error("Failed to fetch assignments:", err);
      }
    };

    if (token && domain) {
      fetch();
    }
  }, [token, domain]);

  const daysLeft = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>📋 All Upcoming Assignments</h2>
      {events.length === 0 ? (
        <p>No upcoming assignments found.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {events.map((event) => (
            <li key={event.id} style={{ marginBottom: "1.5rem" }}>
              <strong>{event.title}</strong>
              <div style={{ fontSize: "0.9rem", color: "#555" }}>
                Due: {new Date(event.due_at).toLocaleString()} ({daysLeft(event.due_at)} day{daysLeft(event.due_at) !== 1 ? "s" : ""} left)
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Assignments;
