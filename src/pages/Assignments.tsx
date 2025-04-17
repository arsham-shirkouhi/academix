import { useEffect, useState } from "react";
import { fetchUpcomingEvents } from "../utils/canvasApi";
import { getUserSettings, updateColorPreferences } from "../utils/firestoreUser";
import { auth } from "../firebase";
import ColorIcon from "../assets/images/icons/color.svg?react";


function Assignments() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [colorPreferences, setColorPreferences] = useState<Record<string, string>>({});
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchTokenAndEvents = async () => {
      const user = auth.currentUser;
      if (!user) return setLoading(false);

      try {
        const settings = await getUserSettings(user.uid);
        if (settings?.token && settings?.domain) {
          setColorPreferences(settings.colorPreferences || {});
          const data = await fetchUpcomingEvents(settings.token, settings.domain);
          const sorted = data
            .map((event: any) => ({
              ...event,
              due_at: event.due_at || event.assignment?.due_at || null,
              title: event.title || event.assignment?.name || "Untitled Assignment",
              html_url: event.html_url || event.assignment?.html_url || "#",
              courseName: (() => {
                const fullName = event.course?.name || event.context?.name || event.context_name || "Untitled Course";
                const parts = fullName.split(" - ");
                return parts.length > 1 ? parts.slice(1).join(" - ").trim() : fullName;
              })(),
            }))
            .filter((event: any) => event.due_at)
            .sort((a: any, b: any) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime());
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
    return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getUrgencyColor = (daysLeft: number | null) => {
    if (daysLeft === null) return "#1F0741";
    if (daysLeft <= 1) return "#D41B1B";
    if (daysLeft <= 3) return "#FF6A00";
    if (daysLeft <= 5) return "#FFB200";
    return "#1DB815";
  };

  const handleColorChange = (course: string, color: string) => {
    const updated = { ...colorPreferences, [course]: color };
    setColorPreferences(updated);
    const user = auth.currentUser;
    if (user) updateColorPreferences(user.uid, updated);
  };

  const uniqueCourses = [...new Set(events.map(e => e.courseName))];

  return (
    <div style={{ padding: "15px", height: "100vh", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
     <style>
  {`
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      scrollbar-width: none;
      -ms-overflow-style: none;
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

    .bounce-loader div:nth-child(2) { animation-delay: -0.2s; }
    .bounce-loader div:nth-child(3) { animation-delay: -0.4s; }

    .assignment-card {
      transition: transform 0.25s ease;
      animation: fadeInUp 0.5s ease forwards;
    }

    .assignment-card:hover {
      transform: scale(1.02);
    }
  `}
</style>


      {/* Modal for color customization */}
      {showModal && (
        <div style={{
          position: "fixed",
          top: 0, left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0,0,0,0.4)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 999
        }}>
          <div style={{
            background: "#fff",
            padding: "20px",
            borderRadius: "10px",
            width: "90%",
            maxWidth: "400px"
          }}>
            <h3>🎨 Customize Course Colors</h3>
            {uniqueCourses.map((course, index) => (
              <div key={index} style={{ marginBottom: "12px" }}>
                <label style={{ fontWeight: "bold", marginRight: "10px" }}>{course}</label>
                <input
                  type="color"
                  value={colorPreferences[course] || "#1f0741"}
                  onChange={(e) => handleColorChange(course, e.target.value)}
                />
              </div>
            ))}
            <button
              onClick={() => setShowModal(false)}
              style={{
                marginTop: "12px",
                backgroundColor: "#ffb703",
                padding: "8px 14px",
                borderRadius: "6px",
                border: "3px solid #1F0741",
                fontWeight: "bold",
                cursor: "pointer"
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Header + Customize button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "42px", fontWeight: "900", color: "#1f0741" }}>All Upcoming Assignments!</h2>
        <button
  onClick={() => setShowModal(true)}
  style={{
    backgroundColor: "#ffb703",
    padding: "10px",
    borderRadius: "6px",
    border: "3px solid #1F0741",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "48px",
    width: "48px"
  }}
  title="Customize Colors"
>
  <ColorIcon style={{ width: "25px", height: "25px" }} />
</button>

      </div>

      {/* Scrollable Assignments View */}
      <div className="no-scrollbar" style={{
        flex: 1,
        overflowY: "auto",
        paddingRight: "6px",
        scrollBehavior: "smooth",
        position: "relative"
      }}>
        {loading ? (
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: "100%",
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
          }}>
            <div className="bounce-loader">
              <div></div>
              <div></div>
              <div></div>
            </div>
            <p style={{ color: "#555", marginTop: "1rem", fontSize: "0.95rem" }}>Loading assignments...</p>
          </div>
        ) : events.length === 0 ? (
          <p>No upcoming assignments found.</p>
        ) : (
<div style={{ display: "flex", flexDirection: "column", gap:"15px"}}>
{events.map((event, index) => {
              const days = daysLeft(event.due_at);
              const urgencyColor = getUrgencyColor(days);
              const courseColor = colorPreferences[event.courseName] || "#1f0741";

              return (
<div
  key={event.id}
  className="assignment-card"
  style={{
    border: `3px solid #1f0741`,
    borderRadius: "10px",
    padding: "15px 15px 15px 30px",
    background: "#fff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    position: "relative",
    animationDelay: `${index * 0.05}s`,
    opacity: 0,
    marginBottom: index === events.length - 1 ? "15px" : "0px",
  }}
>



                  <div style={{
                    position: "absolute",
                    left: "0px",
                    top: "0px",
                    bottom: "0px",
                    width: "15px",
                    backgroundColor: courseColor,
                    borderTopLeftRadius: "8px",
                    borderBottomLeftRadius: "8px",
                  }} />

                  <div>
                    <div style={{ fontWeight: "bold", color: courseColor, fontSize: "24px", marginBottom: "0.25rem" }}>
                      {event.courseName}
                    </div>
                    <div style={{ fontSize: "18px", fontWeight: "bold", color: "#1f0741" }}>
                      {event.title}
                    </div>
                    <div style={{ fontSize: "16px", color: "#333", marginTop: "4px" }}>
                      Due:{" "}
                      {new Date(event.due_at).toLocaleString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                      })}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
                    <div
                      style={{
                        padding: "4px 10px",
                        backgroundColor: urgencyColor,
                        borderRadius: "6px",
                        color: "#fff",
                        fontWeight: "bold",
                        fontSize: "0.85rem",
                        border: "3px solid #1F0741",
                      }}
                    >
                      {days} day{days !== 1 ? "s" : ""} left
                    </div>
                    <a
                      href={event.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        backgroundColor: "#ffb703",
                        padding: "10px 16px",
                        borderRadius: "6px",
                        color: "#1F0741",
                        fontWeight: "bold",
                        fontSize: "16px",
                        border: "3px solid #1F0741",
                        textDecoration: "none",
                        textAlign: "center",
                      }}
                    >
                      View Assignment
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Assignments;
