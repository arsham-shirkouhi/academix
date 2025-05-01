import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchUpcomingEvents } from "../utils/canvasApi";
import { getUserSettings } from "../utils/firestoreUser";
import { auth } from "../firebase";

type Assignment = {
  id: string | number;
  title?: string;
  end_at?: string;
  daysLeft?: number;
};

function UpcomingEvents() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const loadEvents = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const settings = await getUserSettings(user.uid);
        if (!settings?.token || !settings?.domain) return;

        const data = await fetchUpcomingEvents(settings.token, settings.domain);
        console.log("✅ Raw data from Canvas:", data);

        const processed = (data as any[])
          .filter((a) => a.end_at)
          .map((a) => {
            const days = getDaysLeft(a.end_at);
            return {
              id: a.id,
              title: a.title || a.assignment?.name || "Untitled",
              end_at: a.end_at,
              daysLeft: days,
            };
          })
          .filter((a) => a.daysLeft !== undefined && a.daysLeft >= 0)
          .sort(
            (a, b) =>
              new Date(a.end_at!).getTime() - new Date(b.end_at!).getTime()
          );

        setAssignments(processed);
      } catch (error) {
        console.error("❌ Failed to fetch upcoming assignments:", error);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();

    intervalId = setInterval(() => {
      console.log("🔁 Refreshing assignment list...");
      loadEvents();
    }, 15 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  const getDaysLeft = (dueDate: string): number | undefined => {
    const now = new Date();
    const due = new Date(dueDate);
    if (isNaN(due.getTime())) return undefined;
    return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getUrgencyColor = (daysLeft: number | undefined) => {
    if (daysLeft === undefined) return "#1F0741";
    if (daysLeft <= 1) return "#DF1b1b";
    if (daysLeft <= 3) return "#FF6A00";
    if (daysLeft <= 5) return "#FFB200";
    return "#1DB815";
  };

  return (
    <>
      <style>
        {`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }

          @keyframes fadeInUp {
            0% { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>

      <div
        style={{
          backgroundColor: "#FFFBF1",
          borderRadius: "0 0 16px 16px",
          height: "320px", // Keep same height
          display: "flex",
          flexDirection: "column",
          overflow: "hidden", // Prevent content overflow
        }}
      >
        {/* Scrollable area */}
        <div
          className="no-scrollbar"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {loading ? (
            <p>Loading assignments...</p>
          ) : assignments.length === 0 ? (
            <p style={{ color: "#666", marginBottom: "1rem", textAlign: "center" }}>
              No upcoming assignments this week.
            </p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
{assignments.map((assignment, index) => (
  <li
    key={assignment.id}
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: index === assignments.length - 1 ? "0" : "0.75rem",
      opacity: 0,
      animation: "fadeInUp 0.5s ease forwards",
      animationDelay: `${index * 0.05}s`,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
      <span
        style={{
          width: "17.5px",
          height: "17.5px",
          minWidth: "17.5px",
          minHeight: "17.5px",
          display: "inline-block",
          borderRadius: "5px",
          backgroundColor: getUrgencyColor(assignment.daysLeft),
          marginRight: "0.6rem",
          border: "2px solid #000",
          flexShrink: 0,
        }}
      />
      <span
        style={{
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: "200px",
        }}
      >
        {assignment.title}
      </span>
    </div>
    <span
      style={{
        fontSize: "16px",
        fontWeight: 600,
        color: "#1F0741",
      }}
    >
      in {assignment.daysLeft} day
      {assignment.daysLeft !== 1 ? "s" : ""}
    </span>
  </li>
))}

            </ul>
          )}
        </div>

        {/* Fixed Button at bottom */}
        <div
          style={{
            padding: "15px 15px 15px 15px", 
            backgroundColor: "#FFFBF1",
          }}
        >

          <button
            onClick={() => navigate("/assignments")}
            style={{
              width: "100%",
              height: "45px",
              backgroundColor: "#ffb703",
              border: "3px solid #000",
              borderRadius: "6px",
              fontWeight: "bold",
              fontSize: "18px",
              cursor: "pointer",
            }}
          >
            View Assignments
          </button>
        </div>
      </div>
    </>
  );
}

export default UpcomingEvents;
