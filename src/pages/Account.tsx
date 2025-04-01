// src/pages/Account.tsx
import { useState } from "react";
import { fetchUpcomingEvents, fetchCalendarEvents } from "../utils/canvasApi";

function Account({ setEvents, setCalendarEvents }: any) {
  const [token, setToken] = useState(() => localStorage.getItem("canvasToken") || "");
  const [domain, setDomain] = useState(
    () => localStorage.getItem("canvasDomain") || "https://sjsu.instructure.com"
  );
  const [editing, setEditing] = useState(false);

  const handleSave = async () => {
    localStorage.setItem("canvasToken", token);
    localStorage.setItem("canvasDomain", domain);
    setEditing(false);
  
    if (setEvents && setCalendarEvents) {
      try {
        const data = await fetchUpcomingEvents(token, domain);
        setEvents(data);
  
        const calendar = await fetchCalendarEvents(token, domain);
        setCalendarEvents(calendar);
  
        console.log("✅ Canvas API connected. Events and calendar fetched successfully.");
        console.log("📌 Upcoming Events:", data);
        console.log("📅 Calendar Events:", calendar);
      } catch (error) {
        console.error("❌ Error fetching from Canvas:", error);
      }
    } else {
      console.log("✅ Canvas token saved, but no fetch function provided.");
    }
  };
  

  const handleClear = () => {
    localStorage.removeItem("canvasToken");
    localStorage.removeItem("canvasDomain");
    setToken("");
    setDomain("https://sjsu.instructure.com");
    setEditing(true);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Account Settings</h1>

      <div style={{ background: "#f9f9f9", padding: "1.5rem", borderRadius: "8px" }}>
        <p>
          <strong>Name:</strong> Arsham
        </p>
        <p>
          <strong>Email:</strong> youremail@example.com
        </p>

        {!editing ? (
          <>
            <p>
              <strong>Canvas Token:</strong> ••••••••••••••••
            </p>
            <p>
              <strong>Domain:</strong> {domain}
            </p>
            <button
              style={{ marginRight: "1rem" }}
              onClick={() => setEditing(true)}
            >
              ✏️ Edit
            </button>
            <button onClick={handleClear}>❌ Clear</button>
          </>
        ) : (
          <>
            <input
              type="text"
              placeholder="Enter your Canvas API Token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              style={{ width: "300px", marginRight: "1rem", marginBottom: "0.5rem" }}
            />
            <input
              type="text"
              placeholder="Canvas Domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              style={{ width: "300px", marginRight: "1rem", marginBottom: "0.5rem" }}
            />
            <div>
              <button
                onClick={handleSave}
                style={{
                  padding: "0.5rem 1.25rem",
                  backgroundColor: "#FFC02E",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                Save Connection
              </button>
            </div>
          </>
        )}

        <button
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1.25rem",
            backgroundColor: "#FFC02E",
            border: "none",
            borderRadius: "6px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Log Out
        </button>
      </div>
    </div>
  );
}

export default Account;
