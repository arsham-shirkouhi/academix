import { useState } from "react";
import { fetchUpcomingEvents } from "../utils/canvasApi";

function Dashboard() {
  const [token, setToken] = useState("");
  const [domain, setDomain] = useState("https://sjsu.instructure.com");
  const [events, setEvents] = useState<any[]>([]);

  const handleFetch = async () => {
    try {
      const data = await fetchUpcomingEvents(token, domain);
      console.log("Canvas events:", data);
      setEvents(data);
    } catch (error) {
      console.error("Error fetching Canvas events:", error);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      {/* Canvas API Connection Form */}
      <div style={{ marginBottom: "2rem" }}>
        <h2>Connect to Canvas</h2>
        <input
          type="text"
          placeholder="Enter your Canvas API Token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          style={{ width: "300px", marginRight: "1rem" }}
        />
        <input
          type="text"
          placeholder="Canvas Domain"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          style={{ width: "300px", marginRight: "1rem" }}
        />
        <button onClick={handleFetch}>Fetch Events</button>
      </div>

      {/* Displaying Canvas Events */}
      <div>
        {events.length > 0 ? (
          <ul>
            {events.map((event) => (
              <li key={event.id}>{event.title}</li>
            ))}
          </ul>
        ) : (
          <p>No events yet.</p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
