import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchUpcomingEvents, fetchCalendarEvents, fetchUserProfile } from "../utils/canvasApi";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { getUserSettings, saveUserSettings } from "../utils/firestoreUser";



function Account({ setEvents, setCalendarEvents }: any) {
  const [token, setToken] = useState("");
  const [domain, setDomain] = useState("https://sjsu.instructure.com");
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      setEmail(user.email || "");

      getUserSettings(user.uid).then((data) => {
        if (data) {
          setToken(data.token || "");
          setDomain(data.domain || "https://sjsu.instructure.com");

          // ✅ Fetch profile picture if token and domain exist
          if (data.token && data.domain) {
            fetchUserProfile(data.token, data.domain)
              .then((profile) => {
                setAvatarUrl(profile.avatar_url || null);
              })
              .catch(() => {
                setAvatarUrl(null);
              });
          }
        }
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    try {
      await saveUserSettings(user.uid, { token, domain });
      setEditing(false);

      // Refetch events when saving
      if (setEvents && setCalendarEvents) {
        const data = await fetchUpcomingEvents(token, domain);
        setEvents(data);

        const calendar = await fetchCalendarEvents(token, domain);
        setCalendarEvents(calendar);
      }

      // Refetch avatar after saving
      const profile = await fetchUserProfile(token, domain);
      setAvatarUrl(profile.avatar_url || null);

      console.log("✅ Token saved and profile refreshed.");
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

        {/* ✅ Avatar */}
        {avatarUrl && (
          <div style={{ textAlign: "center", marginBottom: "1rem" }}>
            <img
              src={avatarUrl}
              alt="Canvas Profile"
              style={{
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                border: "2px solid #1F0741",
              }}
            />
          </div>
        )}

        <p><strong>Email:</strong> {email}</p>

        {!editing ? (
          <>
            <p><strong>Canvas Token:</strong> ••••••••••••••••</p>
            <p><strong>Domain:</strong> {domain}</p>
            <button onClick={() => setEditing(true)} style={{ marginRight: "1rem" }}>
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
                  border: "3px solid #1F0741",
                  borderRadius: "10px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  boxShadow: "0 3px #1F0741",
                  transition: "all 0.2s ease",
                  transform: "translateY(0)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(2px)";
                  e.currentTarget.style.boxShadow = "0 0 #1F0741";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 3px #1F0741";
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
            border: "3px solid #1F0741",
            borderRadius: "10px",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: "0 3px #1F0741",
            transition: "all 0.2s ease",
            transform: "translateY(0)"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(2px)";
            e.currentTarget.style.boxShadow = "0 0 #1F0741";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 3px #1F0741";
          }}
        >
          Log Out
        </button>
      </div>
    </div>
  );
}

export default Account;
