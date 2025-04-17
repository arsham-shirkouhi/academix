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
    if(daysLeft <= 1) return "#DF1b1b"
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

          @keyframes bounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
          }

          .bounce-loader {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 0.5rem;
          }

          .bounce-loader div {
            width: 12px;
            height: 12px;
            background-color: #1f0741;
            border-radius: 50%;
            animation: bounce 1.2s infinite ease-in-out;
          }

          .bounce-loader div:nth-child(2) {
            animation-delay: -0.2s;
          }

          .bounce-loader div:nth-child(3) {
            animation-delay: -0.4s;
          }
        `}
      </style>

      <div
        className="no-scrollbar"
        style={{
          maxHeight: "320px",
          minHeight: "320px",
          overflowY: "auto",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          padding: "16px",
          position: "relative",
        }}
      >
        {loading ? (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              height: "100%",
              width: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
            }}
          >
            <div className="bounce-loader">
              <div></div>
              <div></div>
              <div></div>
            </div>
            <p style={{ color: "#555", marginTop: "1rem", fontSize: "0.95rem" }}>
              Loading assignments...
            </p>
          </div>
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
                  marginBottom: "0.75rem",
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

        {!loading && (
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
              marginTop: "1rem",
              animation: "fadeInUp 0.4s ease forwards",
              animationDelay: `${assignments.length * 0.05 + 0.2}s`,
              opacity: 0,
            }}
          >
            View Assignments
          </button>
        )}
      </div>
    </>
  );
}

export default UpcomingEvents;
