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
  
      {/* Upcoming Events Component */}
      <UpcomingEvents events={events} />
    </div>
  );
}  

export default Dashboard;
