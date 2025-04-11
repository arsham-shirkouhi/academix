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
  const navigate = useNavigate();

  useEffect(() => {
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
          .sort((a, b) => new Date(a.end_at!).getTime() - new Date(b.end_at!).getTime());

        setAssignments(processed);
      } catch (error) {
        console.error("❌ Failed to fetch upcoming assignments:", error);
      }
    };

    loadEvents();
  }, []);

  const getDaysLeft = (dueDate: string): number | undefined => {
    const now = new Date();
    const due = new Date(dueDate);
    if (isNaN(due.getTime())) return undefined;
    return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getUrgencyColor = (daysLeft: number | undefined) => {
    if (daysLeft === undefined) return "#999";
    if (daysLeft <= 2) return "#E63946"; // red
    if (daysLeft <= 5) return "#E9C46A"; // orange
    return "#2A9D8F"; // green
  };

  return (
    <>
      {/* Hidden Scrollbar Styles for WebKit */}
      <style>
        {`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>

      <div
        className="no-scrollbar"
        style={{
          maxHeight: "320px",
          overflowY: "auto",
          scrollbarWidth: "none", // Firefox
          msOverflowStyle: "none", // IE 10+
          padding: "16px 16px", // ← added even left/right padding
        }}
      >
        {assignments.length === 0 ? (
          <p style={{ color: "#666", marginBottom: "1rem" }}>
            No upcoming assignments this week.
          </p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {assignments.map((assignment) => (
              <li
                key={assignment.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.75rem",
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
                      boxSizing: "border-box",
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
    </>
  );
}

export default UpcomingEvents;
