import { useEffect, useState } from "react";
import { fetchUpcomingEvents } from "../utils/canvasApi";
import UpcomingEvents from "../components/UpcomingEvents";




function Dashboard() {

  const [token, setToken] = useState(() => localStorage.getItem("canvasToken") || "");
  const [domain, setDomain] = useState(() => localStorage.getItem("canvasDomain") || "https://sjsu.instructure.com");
  const [events, setEvents] = useState<any[]>([]);

  const handleFetch = async () => {
    try {
      // Save to localStorage
      localStorage.setItem("canvasToken", token);
      localStorage.setItem("canvasDomain", domain);
  
      const data = await fetchUpcomingEvents(token, domain);
      setEvents(data);
    } catch (error) {
      console.error("Error fetching Canvas events:", error);
    }
    
  };

  useEffect(() => {
    if (token && domain) {
      handleFetch();
    }
  }, []);
  
  

  return (
    <div style={{ padding: "2rem" }}>
      {/* Canvas API Token Input Form */}
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
        <div style={{ backgroundColor: "#f0f0f0", padding: "1rem", borderRadius: "8px" }}>
          <h3>This Week</h3>
          <p>🕒 Study Time: <strong>2h 30m</strong></p>
          <p>✅ Assignments: <strong>2 done</strong></p>
          <p>📋 Tasks Done: <strong>3/5</strong></p>
        </div>
  
        {/* Weekly Calendar */}
        <div style={{ backgroundColor: "#f0f0f0", padding: "1rem", borderRadius: "8px" }}>
          <h3>Weekly Calendar</h3>
          <p><strong>Monday, March 18</strong></p>
          <p>12:00PM - 12:50PM | ENGR10 – Morris Dalley</p>
          <p>1:30PM - 2:45PM | CS46B – Comp Sci Building</p>
          <hr />
          <p><strong>Tuesday, March 19</strong></p>
          <p>9:00AM - 11:45AM | ENGR10 – Engineering Building</p>
          <p>12:00PM - 1:15PM | PHYS51 – Fuguhiro Yoshida</p>
          <p>12:00PM - 1:15PM | AMS10 – AMS Building</p>
          <hr />
          <p><strong>Wednesday, March 20</strong></p>
          <p>12:00PM - 12:50PM | ENGR10 – Engineering Building</p>
          <p>1:30PM - 2:45PM | CS46B – Comp Sci Building</p>
        </div>
  
        {/* Upcoming Events (LIVE from Canvas) */}
        <UpcomingEvents events={events} />
  
        {/* To-Do List */}
        <div style={{ backgroundColor: "#f0f0f0", padding: "1rem", borderRadius: "8px" }}>
          <h3>To-Do</h3>
          <ul>
            <li><input type="checkbox" /> physics homework</li>
            <li><input type="checkbox" /> math assignment</li>
            <li><input type="checkbox" /> cs zybook</li>
            <li><input type="checkbox" /> presentation slides</li>
          </ul>
          <button style={{ marginTop: "1rem", backgroundColor: "orange", color: "white", padding: "0.5rem 1rem", border: "none", borderRadius: "4px" }}>View To-Do’s</button>
        </div>
  
        {/* GPA Tracker */}
        <div style={{ backgroundColor: "#2e004f", padding: "1rem", borderRadius: "8px", color: "white" }}>
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
