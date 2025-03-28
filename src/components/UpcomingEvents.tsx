import { useEffect, useState } from "react";
import { fetchUpcomingEvents } from "../utils/canvasApi";

function UpcomingEvents() {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    // fetchUpcomingEvents()
    //   .then((data) => {
    //     console.log("Canvas data:", data);
    //     setEvents(data);
    //   })
    //   .catch((err) => console.error("Canvas API error:", err));
  }, []);
  

  return (
    <div
      style={{
        backgroundColor: "#f0f0f0",
        padding: "1rem",
        borderRadius: "8px",
        height: "250px",
        overflowY: "auto",
      }}
    >
      <h3 style={{ marginBottom: "1rem" }}>Upcoming</h3>
  
      {events.length === 0 ? (
        <p>No events found.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {events.map((event) => (
            <li key={event.id} style={{ marginBottom: "1rem" }}>
              <strong>{event.title}</strong>
              <div style={{ fontSize: "0.85rem", color: "#555" }}>
                {new Date(event.due_at).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
  
}

export default UpcomingEvents;
