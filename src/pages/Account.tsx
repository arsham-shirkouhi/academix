import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchUpcomingEvents, fetchCalendarEvents } from "../utils/canvasApi";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { getUserSettings, saveUserSettings } from "../utils/firestoreUser";

function Account({ setEvents, setCalendarEvents }: any) {
  const [token, setToken] = useState("");
  const [domain, setDomain] = useState("https://sjsu.instructure.com");
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      setEmail(user.email || "");

      getUserSettings(user.uid).then((data) => {
        if (data) {
          setToken(data.token || "");
          setDomain(data.domain || "https://sjsu.instructure.com");
        }
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    try {
      await saveUserSettings(user.uid, { token, domain });
      setEditing(false);

      if (setEvents && setCalendarEvents) {
        const data = await fetchUpcomingEvents(token, domain);
        setEvents(data);

        const calendar = await fetchCalendarEvents(token, domain);
        setCalendarEvents(calendar);
      }

      console.log("✅ Token saved to Firestore and data fetched.");
    } catch (err) {
      console.error("❌ Error saving token:", err);
    }
  };

  const handleClear = () => {
    setToken("");
    setDomain("https://sjsu.instructure.com");
    setEditing(true);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Account Settings</h1>

      <div style={{ background: "#f9f9f9", padding: "1.5rem", borderRadius: "8px" }}>
        <p><strong>Email:</strong> {email}</p>

        {!editing ? (
          <>
            <p><strong>Canvas Token:</strong> ••••••••••••••••</p>
            <p><strong>Domain:</strong> {domain}</p>
            <button onClick={() => setEditing(true)} style={{ marginRight: "1rem" }}>✏️ Edit</button>
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
          onClick={handleLogout}
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1.25rem",
            backgroundColor: "#FF5C5C",
            color: "#fff",
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
