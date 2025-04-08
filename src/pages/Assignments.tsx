import { useEffect, useState } from "react";
import { fetchUpcomingEvents } from "../utils/canvasApi";
import { getUserSettings } from "../utils/firestoreUser";
import { auth } from "../firebase";

function Assignments() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTokenAndEvents = async () => {
      const user = auth.currentUser;
      if (!user) return setLoading(false);

      try {
        const settings = await getUserSettings(user.uid);
        if (settings?.token && settings?.domain) {
          const data = await fetchUpcomingEvents(settings.token, settings.domain);
          const sorted = data.sort(
            (a: any, b: any) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime()
          );
          setEvents(sorted);
        }
      } catch (err) {
        console.error("❌ Failed to load assignments:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTokenAndEvents();
  }, []);

  const daysLeft = (dueDate: string) => {
    if (!dueDate) return null;
    const now = new Date();
    const due = new Date(dueDate);
    if (isNaN(due.getTime())) return null;
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const bounceKeyframes = `
    @keyframes dotBounce {
      0% {
        transform: translateY(0);
        opacity: 0.6;
      }
      100% {
        transform: translateY(-10px);
        opacity: 1;
      }
    }
  `;

  return (
    <div style={{ padding: "2rem" }}>
      <style>{bounceKeyframes}</style>
      <h2>📋 All Upcoming Assignments</h2>

      {loading ? (
        <div style={{ marginTop: "2rem", textAlign: "center" }}>
          <div style={{
            display: "inline-flex",
            gap: "8px",
            justifyContent: "center",
            alignItems: "center"
          }}>
            {[0, 1, 2].map((_, i) => (
              <div key={i} style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: "#1f0741",
                animation: `dotBounce 0.6s infinite alternate`,
                animationDelay: `${i * 0.2}s`
              }} />
            ))}
          </div>
          <p style={{ marginTop: "0.75rem", color: "#555" }}>Loading assignments...</p>
        </div>
      ) : events.length === 0 ? (
        <p>No upcoming assignments found.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {events.map((event) => (
            <li key={event.id} style={{ marginBottom: "1.5rem" }}>
              <strong>{event.title}</strong>
              <div style={{ fontSize: "0.9rem", color: "#555" }}>
                Due: {new Date(event.due_at).toLocaleString()} (
                {daysLeft(event.due_at) !== null
                  ? `${daysLeft(event.due_at)} day${daysLeft(event.due_at) !== 1 ? "s" : ""} left`
                  : "no due date"}
                )
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Assignments;
