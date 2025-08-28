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
    <div style={{ padding: "15px 15px 15px 15px", height: "100vh", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
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
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          @keyframes fadeOut {
            0% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-10px); }
          }
          .skeleton {
            background: linear-gradient(
              90deg,
              #f0f0f0 25%,
              #e0e0e0 37%,
              #f0f0f0 63%
            );
            background-size: 200% 100%;
            animation: shimmer 2.5s infinite ease-in-out;
            border-radius: 4px;
          }
          .skeleton-container {
            animation: fadeOut 0.5s ease-in-out forwards;
            animation-play-state: paused;
          }
          .skeleton-container.fade-out {
            animation-play-state: running;
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
            background: "#FFFBF1",
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
                borderRadius: "10px",
                border: "3px solid #1F0741",
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
            borderRadius: "10px",
            border: "3px solid #1F0741",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "48px",
            width: "48px",
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
          title="Customize Colors"
        >
          <ColorIcon style={{ width: "25px", height: "25px" }} />
        </button>
      </div>

      {/* Scrollable Assignments View */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        overflowX: "visible",
        width: "100%",
        paddingRight: 0,
        paddingLeft: 0,
        paddingTop: "10px",
        paddingBottom: "10px",
        scrollBehavior: "smooth",
        position: "relative"
      }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {[1, 2, 3, 4].map((_, index) => (
              <div
                key={index}
                className={`skeleton-container ${!loading ? 'fade-out' : ''}`}
                style={{
                  border: "3px solid #e0e0e0",
                  borderRadius: "10px",
                  padding: "15px 15px 15px 30px",
                  background: "#FFFBF1",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  position: "relative",
                  animation: `fadeInUp 0.5s ease forwards ${index * 0.15}s`,
                  opacity: 0
                }}
              >
                {/* Left color indicator */}
                <div className="skeleton" style={{
                  position: "absolute",
                  left: "0px",
                  top: "0px",
                  bottom: "0px",
                  width: "15px",
                  borderTopLeftRadius: "8px",
                  borderBottomLeftRadius: "8px"
                }} />

                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{
                    width: "180px",
                    height: "28px",
                    marginBottom: "0.5rem"
                  }} />
                  <div className="skeleton" style={{
                    width: "250px",
                    height: "22px",
                    marginBottom: "0.5rem"
                  }} />
                  <div className="skeleton" style={{
                    width: "200px",
                    height: "18px"
                  }} />
                </div>

                <div style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center"
                }}>
                  <div className="skeleton" style={{
                    width: "80px",
                    height: "28px",
                    borderRadius: "6px"
                  }} />
                  <div className="skeleton" style={{
                    width: "120px",
                    height: "40px",
                    borderRadius: "6px"
                  }} />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <p>No upcoming assignments found.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {events.map((event, index) => {
              const days = daysLeft(event.due_at);
              const urgencyColor = getUrgencyColor(days);
              const courseColor = colorPreferences[event.courseName] || "#1f0741";

              return (
                <div
                  key={event.id}
                  style={{
                    transition: "transform 0.2s ease-in-out",
                    transform: "scale(1)",
                    marginLeft: "10px",
                    marginRight: "10px"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.02)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  <div
                    className="assignment-card"
                    style={{
                      border: `3px solid #1f0741`,
                      borderRadius: "10px",
                      padding: "15px 15px 15px 30px",
                      background: "#FFFBF1",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      position: "relative",
                      animation: "fadeInUp 0.5s ease forwards",
                      animationDelay: `${index * 0.05}s`,
                      opacity: 0,
                      marginBottom: index === events.length - 1 ? "15px" : "0px"
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

                    {/* Days left badge - top right */}
                    <div
                      style={{
                        position: "absolute",
                        top: "10px",
                        right: "10px",
                        padding: "4px 10px",
                        backgroundColor: urgencyColor,
                        borderRadius: "6px",
                        color: "#FFFBF1",
                        fontWeight: "bold",
                        fontSize: "0.85rem",
                        border: "3px solid #1F0741",
                        zIndex: 1
                      }}
                    >
                      {days} day{days !== 1 ? "s" : ""} left
                    </div>

                    <div>
                      <a
                        href={event.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: "20px",
                          fontWeight: "bold",
                          color: courseColor,
                          textDecoration: "underline",
                          cursor: "pointer",
                          marginBottom: "0.5rem",
                          display: "block",
                          transition: "color 0.2s ease-in-out"
                        }}
                        onMouseEnter={(e) => {
                          // Create a darker version of the course color
                          const darkerColor = courseColor === "#1f0741" ? "#0a031a" :
                            courseColor.startsWith("#") ?
                              courseColor.replace(/^#/, "").match(/.{2}/g)?.map(hex =>
                                Math.max(0, parseInt(hex, 16) - 40).toString(16).padStart(2, "0")
                              ).join("") : courseColor;
                          e.currentTarget.style.color = `#${darkerColor}`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = courseColor;
                        }}
                      >
                        {event.title}
                      </a>
                      <div style={{ fontSize: "16px", color: "#1f0741", fontWeight: "600", marginBottom: "0.5rem" }}>
                        {event.courseName}
                      </div>
                      <div style={{ fontSize: "14px", color: "#666", marginTop: "4px" }}>
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
