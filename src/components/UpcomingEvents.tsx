import { useNavigate } from "react-router-dom";

type UpcomingEventsProps = {
  events: any[];
};

function UpcomingEvents({ events }: UpcomingEventsProps) {
  const navigate = useNavigate();

  // Sort by due date
  const sorted = [...events].sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime());

  // Get top 4
  const topEvents = sorted.slice(0, 4);

  // Urgency color
  const getUrgencyColor = (daysLeft: number) => {
    if (daysLeft <= 1) return "#E63946"; // red
    if (daysLeft <= 2) return "#F4A261"; // orange
    if (daysLeft <= 4) return "#E9C46A"; // yellow
    return "#2A9D8F"; // green
  };

  const daysLeft = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div style={{ backgroundColor: "#f0f0f0", padding: "1rem", borderRadius: "8px" }}>
      <h3 style={{ marginBottom: "1rem" }}>Upcoming</h3>

      {topEvents.length === 0 ? (
        <p>No upcoming events.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {topEvents.map((event: any) => {
            const days = daysLeft(event.due_at);
            return (
              <li key={event.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
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
                <span style={{ fontSize: "0.85rem", color: "#555" }}>in {days} day{days !== 1 ? "s" : ""}</span>
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
