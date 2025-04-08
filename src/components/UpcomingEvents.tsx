import { useNavigate } from "react-router-dom";

type UpcomingEventsProps = {
  events: any[];
};

function UpcomingEvents({ events }: UpcomingEventsProps) {
  const navigate = useNavigate();

  const getEventDate = (event: any): string | null => {
    return event.due_at || event.start_at || null;
  };

  const daysLeft = (event: any): number | null => {
    const dateStr = getEventDate(event);
    if (!dateStr) return null;

    const now = new Date();
    const target = new Date(dateStr);
    if (isNaN(target.getTime())) return null;

    return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getUrgencyColor = (daysLeft: number | null) => {
    if (daysLeft === null) return "#999";
    if (daysLeft <= 1) return "#E63946";
    if (daysLeft <= 2) return "#F4A261";
    if (daysLeft <= 4) return "#E9C46A";
    return "#2A9D8F";
  };

  // Filter to only include events within 7 days
  const upcomingThisWeek = events.filter((event) => {
    const days = daysLeft(event);
    return days !== null && days <= 7 && days >= 0;
  });

  const sorted = upcomingThisWeek.sort((a, b) => {
    const aDate = new Date(getEventDate(a) || "").getTime();
    const bDate = new Date(getEventDate(b) || "").getTime();
    return aDate - bDate;
  });

  return (
    <div
      style={{
        maxHeight: "320px",
        overflowY: "auto",
      }}
    >

      {sorted.length === 0 ? (
        <p>No upcoming events this week.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {sorted.map((event: any) => {
            const days = daysLeft(event);
            return (
              <li
                key={event.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.75rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span
                    style={{
                      display: "inline-block",
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      backgroundColor: getUrgencyColor(days),
                      marginRight: "0.5rem",
                    }}
                  />
                  <span>{event.title}</span>
                </div>
                <span style={{ fontSize: "0.85rem", color: "#555" }}>
                  {days !== null ? `in ${days} day${days !== 1 ? "s" : ""}` : "no date"}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <button
        onClick={() => navigate("/assignments")}
        style={{
          marginTop: "1rem",
          width: "100%",
          padding: "0.5rem 1rem",
          backgroundColor: "#ffb703",
          border: "2px solid #000",
          borderRadius: "6px",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        View Assignments
      </button>
    </div>
  );
}

export default UpcomingEvents;
