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

  // Skeleton loading component
  const LoadingSkeleton = () => {
    return Array(4).fill(null).map((_, index) => (
      <div
        key={index}
        style={{
          padding: "12px",
          borderBottom: "2px solid #f0f0f0",
          opacity: 0.7,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {/* Title skeleton */}
          <div
            style={{
              height: "20px",
              background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 2s infinite",
              borderRadius: "4px",
              width: "80%"
            }}
          />
          {/* Date skeleton */}
          <div
            style={{
              height: "16px",
              background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 2s infinite",
              borderRadius: "4px",
              width: "40%"
            }}
          />
        </div>
      </div>
    ));
  };

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

          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}
      </style>

      <div
        style={{
          backgroundColor: "#FFFBF1",
          display: "flex",
          flexDirection: "column",
          height: "300px",
          position: "relative"
        }}
      >
        <div
          className="no-scrollbar"
          style={{
            height: "calc(100% - 55px)",
            overflowY: "auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {loading ? (
            <LoadingSkeleton />
          ) : assignments.length === 0 ? (
            <p style={{ color: "#666", textAlign: "center", margin: 0, fontSize: "14px" }}>
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
                    marginBottom: index === assignments.length - 1 ? "0" : "0.5rem",
                    padding: "4px 0",
                    opacity: 0,
                    animation: "fadeInUp 0.5s ease forwards",
                    animationDelay: `${index * 0.05}s`,
                    cursor: "pointer"
                  }}
                  onClick={() => navigate("/assignments")}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span
                      style={{
                        width: "18px",
                        height: "18px",
                        minWidth: "18px",
                        minHeight: "18px",
                        display: "inline-block",
                        borderRadius: "6px",
                        backgroundColor: getUrgencyColor(assignment.daysLeft),
                        marginRight: "0.5rem",
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
                        fontSize: "16px"
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
                      marginLeft: "8px"
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
      </div>
    </>
  );
}

export default UpcomingEvents;
