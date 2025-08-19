import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { saveUserSchedule, loadUserSchedule, getUserSettings } from "../utils/firestoreUser";

type ClassEntry = {
  id: string;
  name: string;
  day: string;
  startTime: string;
  endTime: string;
  location: string;
  type: "" | "Class" | "Study" | "Workout" | "Free";
  recurring?: "none" | "weekly" | "biweekly" | "monthly";
  description?: string;
};

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const HOURS = Array.from({ length: 24 }, (_, i) => {
  if (i === 0) return "12 AM";
  if (i === 12) return "12 PM";
  return i > 12 ? `${i - 12} PM` : `${i} AM`;
});

function Planner() {
  const [schedule, setSchedule] = useState<ClassEntry[]>([]);
  const [courseNames, setCourseNames] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [currentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string>(
    ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()]
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [newClass, setNewClass] = useState<ClassEntry>({
    id: crypto.randomUUID(),
    name: "",
    day: "",
    startTime: "",
    endTime: "",
    location: "",
    type: "",
    recurring: "none",
    description: "",
  });
  const [editingEvent, setEditingEvent] = useState<ClassEntry | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchScheduleAndCourses = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const [stored, settings] = await Promise.all([
        loadUserSchedule(user.uid),
        getUserSettings(user.uid)
      ]);

      setSchedule(stored);

      if (settings?.token && settings?.domain) {
        const cleanDomain = settings.domain.replace(/^https?:\/\//, "");
        try {
          const res = await fetch("/api/canvas-courses", {
            method: "POST",
            body: JSON.stringify({
              token: settings.token,
              domain: `https://${cleanDomain}`,
            }),
          });

          const courses = await res.json();
          const names = courses.map((c: any) => {
            const full = c.name || "";
            const parts = full.split(" - ");
            return parts.length > 1 ? parts.slice(1).join(" - ").trim() : full;
          });
          setCourseNames(names);
        } catch (err) {
          console.error("❌ Failed to fetch courses:", err);
        }
      }
    };

    fetchScheduleAndCourses();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewClass((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddClass = async () => {
    if (
      !newClass.name ||
      !newClass.day ||
      !newClass.startTime ||
      !newClass.endTime ||
      !newClass.location ||
      !newClass.type
    ) {
      alert("Please fill in all fields before adding the event.");
      return;
    }

    const updated = [...schedule, { ...newClass, id: crypto.randomUUID() }];
    setSchedule(updated);

    const user = auth.currentUser;
    if (user) await saveUserSchedule(user.uid, updated);

    setShowForm(false);
    setNewClass({
      id: crypto.randomUUID(),
      name: "",
      day: "",
      startTime: "",
      endTime: "",
      location: "",
      type: "",
      recurring: "none",
      description: "",
    });
  };

  const handleDeleteEvent = async (eventId: string) => {
    const updated = schedule.filter(event => event.id !== eventId);
    setSchedule(updated);

    const user = auth.currentUser;
    if (user) await saveUserSchedule(user.uid, updated);

    setShowDeleteConfirm(null);
  };

  const handleEditEvent = (event: ClassEntry) => {
    setEditingEvent(event);
    setNewClass(event);
    setShowForm(true);
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent) return;

    if (
      !newClass.name ||
      !newClass.day ||
      !newClass.startTime ||
      !newClass.endTime ||
      !newClass.location ||
      !newClass.type
    ) {
      alert("Please fill in all fields before updating the event.");
      return;
    }

    const updated = schedule.map(event =>
      event.id === editingEvent.id ? { ...newClass, id: editingEvent.id } : event
    );
    setSchedule(updated);

    const user = auth.currentUser;
    if (user) await saveUserSchedule(user.uid, updated);

    setShowForm(false);
    setEditingEvent(null);
    setNewClass({
      id: crypto.randomUUID(),
      name: "",
      day: "",
      startTime: "",
      endTime: "",
      location: "",
      type: "",
      recurring: "none",
      description: "",
    });
  };

  const renderEvents = (day: string) => {
    const eventsForDay = schedule.filter((cls) => cls.day === day);

    const getMinutes = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };

    const getEventColor = (type: string) => {
      switch (type) {
        case "Class": return "#1F0741";
        case "Study": return "#2200ff";
        case "Workout": return "#D41B1B";
        case "Free": return "#1DB815";
        default: return "#1F0741";
      }
    };

    return eventsForDay.map((cls) => {
      const top = getMinutes(cls.startTime) * (36 / 60) - 18;
      const height = (getMinutes(cls.endTime) - getMinutes(cls.startTime)) * (36 / 60);

      return (
        <div
          key={cls.id}
          style={{
            position: "absolute",
            top: `${top}px`,
            height: `${height}px`,
            left: "2px",
            width: "calc(100% - 4px)",
            background: getEventColor(cls.type),
            color: "#FFFBF1",
            borderRadius: "6px",
            padding: "4px 6px",
            fontSize: "11px",
            zIndex: 10,
            border: "1px solid #FFFBF1",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            overflow: "hidden"
          }}
          onClick={() => handleEditEvent(cls)}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.02)";
            e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.15)";
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <strong style={{ fontSize: "12px", marginBottom: "1px", flex: 1 }}>{cls.name}</strong>
            {cls.recurring && cls.recurring !== "none" && (
              <span style={{
                fontSize: "8px",
                backgroundColor: "rgba(255,255,255,0.2)",
                padding: "1px 3px",
                borderRadius: "3px",
                marginLeft: "4px"
              }}>
                {cls.recurring}
              </span>
            )}
          </div>
          <div style={{ fontSize: "10px", opacity: 0.9 }}>
            {cls.startTime}–{cls.endTime}
          </div>
          <div style={{ fontSize: "10px", opacity: 0.9 }}>{cls.location}</div>
        </div>
      );
    });
  };

  const getDayEvents = (day: string) => {
    return schedule
      .filter(event => event.day === day)
      .sort((a, b) => {
        const timeA = new Date(`2000-01-01T${a.startTime}`).getTime();
        const timeB = new Date(`2000-01-01T${b.startTime}`).getTime();
        return timeA - timeB;
      });
  };

  // Get dates for the week
  const getDatesForWeek = () => {
    const dates = [];
    const curr = new Date(currentDate);
    const first = curr.getDate() - curr.getDay();

    for (let i = 0; i < 7; i++) {
      const date = new Date(curr.setDate(first + i));
      dates.push({
        dayName: DAYS[i],
        date: date.getDate(),
        isToday: date.toDateString() === new Date().toDateString()
      });
    }
    return dates;
  };

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column"
    }}>
      {/* Fixed Header */}
      <div style={{
        padding: "15px 15px 0 15px",
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "15px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <button
              onClick={() => navigate('/')}
              style={{
                padding: "10px 20px",
                fontSize: "16px",
                backgroundColor: "#1F0741",
                color: "#FFFBF1",
                border: "2px solid #1F0741",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: "500",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#2a0a5a";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#1F0741";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              ← Back to Dashboard
            </button>
            <h1 style={{
              fontSize: "42px",
              margin: 0,
              color: "#1F0741",
              fontWeight: "bold"
            }}>
              Weekly Schedule
            </h1>
          </div>

          {/* Compact Statistics */}
          <div style={{
            display: "flex",
            gap: "15px",
            alignItems: "center",
            flexWrap: "wrap"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#FFFBF1",
              border: "2px solid #1F0741",
              borderRadius: "8px",
              padding: "8px 12px"
            }}>
              <span style={{ color: "#1F0741", fontWeight: "500" }}>Classes:</span>
              <span style={{
                color: "#1F0741",
                fontWeight: "bold"
              }}>
                {schedule.filter(event => event.type === "Class")
                  .reduce((total, event) => {
                    const start = new Date(`2000-01-01T${event.startTime}`);
                    const end = new Date(`2000-01-01T${event.endTime}`);
                    return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                  }, 0).toFixed(1)}h
              </span>
            </div>

            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#FFFBF1",
              border: "2px solid #1F0741",
              borderRadius: "8px",
              padding: "8px 12px"
            }}>
              <span style={{ color: "#1F0741", fontWeight: "500" }}>Study:</span>
              <span style={{
                color: "#2200ff",
                fontWeight: "bold"
              }}>
                {schedule.filter(event => event.type === "Study")
                  .reduce((total, event) => {
                    const start = new Date(`2000-01-01T${event.startTime}`);
                    const end = new Date(`2000-01-01T${event.endTime}`);
                    return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                  }, 0).toFixed(1)}h
              </span>
            </div>

            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#FFFBF1",
              border: "2px solid #1F0741",
              borderRadius: "8px",
              padding: "8px 12px"
            }}>
              <span style={{ color: "#1F0741", fontWeight: "500" }}>Workout:</span>
              <span style={{
                color: "#D41B1B",
                fontWeight: "bold"
              }}>
                {schedule.filter(event => event.type === "Workout")
                  .reduce((total, event) => {
                    const start = new Date(`2000-01-01T${event.startTime}`);
                    const end = new Date(`2000-01-01T${event.endTime}`);
                    return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                  }, 0).toFixed(1)}h
              </span>
            </div>

            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#FFFBF1",
              border: "2px solid #1F0741",
              borderRadius: "8px",
              padding: "8px 12px"
            }}>
              <span style={{ color: "#1F0741", fontWeight: "500" }}>Free:</span>
              <span style={{
                color: "#1DB815",
                fontWeight: "bold"
              }}>
                {schedule.filter(event => event.type === "Free")
                  .reduce((total, event) => {
                    const start = new Date(`2000-01-01T${event.startTime}`);
                    const end = new Date(`2000-01-01T${event.endTime}`);
                    return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                  }, 0).toFixed(1)}h
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "0 15px 15px 15px",
        width: "100%",
        maxWidth: "100%"
      }}>
        {/* Enhanced Calendar */}
        <div style={{
          border: "3px solid #1F0741",
          borderRadius: "16px",
          overflow: "hidden",
          backgroundColor: "#FFFBF1",
          marginBottom: "30px",
          height: "600px",
          display: "flex",
          flexDirection: "column",
          width: "100%",
          boxShadow: "0 8px 32px rgba(31, 7, 65, 0.1)"
        }}>
          {/* Calendar Header */}
          <div style={{
            display: "flex",
            background: "linear-gradient(135deg, #1F0741 0%, #2a0a5a 100%)",
            color: "#FFFBF1",
            position: "sticky",
            top: 0,
            zIndex: 20,
            width: "100%",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
          }}>
            <div style={{
              width: "60px",
              borderRight: "1px solid rgba(255,251,241,0.2)",
              position: "sticky",
              left: 0,
              zIndex: 21,
              background: "linear-gradient(135deg, #1F0741 0%, #2a0a5a 100%)",
            }}
            />
            {getDatesForWeek().map(({ dayName, date, isToday }) => (
              <div
                key={dayName}
                style={{
                  flex: 1,
                  minWidth: "120px",
                  borderLeft: "1px solid rgba(255,251,241,0.2)",
                  display: "flex",
                  alignItems: "center",
                  padding: "15px 8px",
                  backgroundColor: isToday ? "#ffb703" : "transparent",
                  color: isToday ? "#1F0741" : "#FFFBF1",
                  transition: "all 0.2s ease"
                }}
              >
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "14px",
                  fontWeight: "500",
                }}>
                  <span style={{ fontSize: "12px", opacity: 0.8 }}>{dayName.slice(0, 3)}</span>
                  <span style={{
                    fontSize: "20px",
                    fontWeight: isToday ? "bold" : "600"
                  }}>
                    {date}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div style={{
            display: "flex",
            position: "relative",
            flex: 1,
            overflow: "auto",
            width: "100%",
            backgroundColor: "#FFFFFF",
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }} className="hide-scrollbar">
            {/* Time Column */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              width: "60px",
              backgroundColor: "#f8f9fa",
              position: "sticky",
              left: 0,
              zIndex: 15,
              borderRight: "2px solid #e9ecef"
            }}>
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  style={{
                    position: "relative",
                    height: "36px",
                    fontSize: "11px",
                    color: "#6c757d",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "600",
                    transform: "translateY(-50%)",
                    backgroundColor: "#f8f9fa"
                  }}
                >
                  {hour}
                </div>
              ))}
            </div>

            {/* Days Columns */}
            <div style={{
              display: "flex",
              minWidth: "fit-content",
              width: "100%",
              backgroundColor: "#FFFFFF",
              msOverflowStyle: "none",
              scrollbarWidth: "none",
            }} className="hide-scrollbar">
              {DAYS.map((day) => (
                <div
                  key={day}
                  style={{
                    flex: 1,
                    minWidth: "120px",
                    borderLeft: "1px solid #e9ecef",
                    position: "relative",
                    height: "864px",
                    backgroundImage: `linear-gradient(#f8f9fa 1px, transparent 1px)`,
                    backgroundSize: "100% 36px",
                    backgroundPosition: "0 -18px",
                    backgroundColor: "#FFFFFF"
                  }}
                >
                  {renderEvents(day)}
                </div>
              ))}
            </div>
          </div>

          <style>
            {`
              .hide-scrollbar::-webkit-scrollbar {
                display: none;
              }
              .hide-scrollbar {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
            `}
          </style>
        </div>

        {/* Enhanced Daily Events List Section */}
        <div style={{
          marginBottom: "30px"
        }}>
          <div style={{
            backgroundColor: "#FFFBF1",
            border: "3px solid #1F0741",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(31, 7, 65, 0.1)"
          }}>
            <div style={{
              background: "linear-gradient(135deg, #1F0741 0%, #2a0a5a 100%)",
              padding: "20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "15px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <h2 style={{
                  margin: 0,
                  color: "#FFFBF1",
                  fontSize: "24px",
                  fontWeight: "bold"
                }}>
                  Daily Schedule
                </h2>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  style={{
                    padding: "10px 15px",
                    fontSize: "16px",
                    backgroundColor: "#FFFBF1",
                    border: "2px solid #1F0741",
                    borderRadius: "10px",
                    color: "#1F0741",
                    cursor: "pointer",
                    fontWeight: "500"
                  }}
                >
                  {DAYS.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: "10px 15px",
                  fontSize: "16px",
                  backgroundColor: "#FFFBF1",
                  border: "2px solid #1F0741",
                  borderRadius: "10px",
                  width: "250px",
                  fontWeight: "500"
                }}
              />
            </div>

            <div style={{
              padding: "20px",
              maxHeight: "400px",
              overflowY: "auto"
            }}>
              {getDayEvents(selectedDay)
                .filter(event =>
                  event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  event.location.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((event, index) => (
                  <div
                    key={event.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "20px",
                      backgroundColor: index % 2 === 0 ? "#FFFBF1" : "#f8f9fa",
                      borderBottom: index !== getDayEvents(selectedDay).length - 1 ? "1px solid #e9ecef" : "none",
                      transition: "all 0.2s ease",
                      cursor: "pointer",
                      borderRadius: "8px",
                      marginBottom: "8px"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateX(10px)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(31, 7, 65, 0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateX(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                    onClick={() => handleEditEvent(event)}
                  >
                    <div style={{
                      width: "140px",
                      borderRight: "2px solid #1F0741",
                      paddingRight: "20px"
                    }}>
                      <div style={{
                        fontSize: "18px",
                        fontWeight: "bold",
                        color: "#1F0741"
                      }}>
                        {event.startTime} - {event.endTime}
                      </div>
                    </div>

                    <div style={{
                      flex: 1,
                      paddingLeft: "20px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}>
                      <div>
                        <div style={{
                          fontSize: "18px",
                          fontWeight: "bold",
                          color: "#1F0741",
                          marginBottom: "5px"
                        }}>
                          {event.name}
                        </div>
                        <div style={{
                          fontSize: "14px",
                          color: "#666",
                          marginBottom: "3px"
                        }}>
                          📍 {event.location}
                        </div>
                        {event.description && (
                          <div style={{
                            fontSize: "12px",
                            color: "#888",
                            fontStyle: "italic"
                          }}>
                            {event.description}
                          </div>
                        )}
                      </div>

                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px"
                      }}>
                        <div style={{
                          padding: "8px 16px",
                          borderRadius: "20px",
                          fontSize: "14px",
                          fontWeight: "500",
                          backgroundColor: (() => {
                            switch (event.type) {
                              case "Class": return "#1F0741";
                              case "Study": return "#2200ff";
                              case "Workout": return "#D41B1B";
                              case "Free": return "#1DB815";
                              default: return "#1F0741";
                            }
                          })(),
                          color: "#FFFBF1"
                        }}>
                          {event.type}
                        </div>

                        {event.recurring && event.recurring !== "none" && (
                          <div style={{
                            padding: "6px 12px",
                            borderRadius: "15px",
                            fontSize: "12px",
                            fontWeight: "500",
                            backgroundColor: "#ffb703",
                            color: "#1F0741",
                            border: "1px solid #1F0741"
                          }}>
                            {event.recurring}
                          </div>
                        )}

                        <div style={{
                          marginLeft: "10px",
                          padding: "8px 16px",
                          backgroundColor: "#ffb703",
                          borderRadius: "10px",
                          fontSize: "14px",
                          fontWeight: "500",
                          color: "#1F0741",
                          border: "2px solid #1F0741",
                          whiteSpace: "nowrap"
                        }}>
                          {(() => {
                            const start = new Date(`2000-01-01T${event.startTime}`);
                            const end = new Date(`2000-01-01T${event.endTime}`);
                            const diff = (end.getTime() - start.getTime()) / (1000 * 60);
                            return `${diff} min`;
                          })()}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteConfirm(event.id);
                          }}
                          style={{
                            padding: "8px 12px",
                            backgroundColor: "#dc3545",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: "500",
                            transition: "all 0.2s ease"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#c82333";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "#dc3545";
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

              {getDayEvents(selectedDay).length === 0 && (
                <div style={{
                  padding: "40px",
                  textAlign: "center",
                  color: "#666"
                }}>
                  <p style={{
                    fontSize: "18px",
                    margin: "0 0 20px 0"
                  }}>
                    No events scheduled for {selectedDay}
                  </p>
                  <button
                    onClick={() => setShowForm(true)}
                    style={{
                      padding: "12px 24px",
                      fontSize: "16px",
                      backgroundColor: "#ffb703",
                      color: "#1F0741",
                      border: "3px solid #1F0741",
                      borderRadius: "10px",
                      cursor: "pointer",
                      fontWeight: "500",
                      boxShadow: "0 3px #1F0741",
                      transform: "translateY(0)",
                      transition: "all 0.2s ease"
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
                    Add New Event
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Event Button */}
      <button
        onClick={() => setShowForm(true)}
        style={{
          position: "fixed",
          bottom: "25px",
          right: "25px",
          width: "60px",
          height: "60px",
          fontSize: "28px",
          borderRadius: "15px",
          backgroundColor: "#ffb703",
          color: "#1F0741",
          border: "3px solid #1F0741",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px #1F0741",
          transform: "translateY(0)",
          transition: "all 0.2s ease",
          zIndex: 100
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(2px)";
          e.currentTarget.style.boxShadow = "0 0 #1F0741";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 4px #1F0741";
        }}
      >
        ＋
      </button>

      {/* Enhanced Modal Form */}
      {showForm && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "#FFFBF1",
            padding: "30px",
            borderRadius: "20px",
            border: "3px solid #1F0741",
            width: "500px",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 20px 60px rgba(31, 7, 65, 0.3)"
          }}>
            <h2 style={{
              margin: "0 0 25px 0",
              color: "#1F0741",
              fontSize: "28px",
              textAlign: "center"
            }}>
              {editingEvent ? "Edit Event" : "Add Event"}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <input
                type="text"
                name="name"
                list="course-options"
                placeholder="Event Name"
                value={newClass.name}
                onChange={handleChange}
                style={{
                  padding: "12px 15px",
                  fontSize: "16px",
                  border: "2px solid #1F0741",
                  borderRadius: "10px",
                  backgroundColor: "#FFFBF1"
                }}
              />
              <datalist id="course-options">
                {courseNames.map((name, i) => <option key={i} value={name} />)}
              </datalist>

              <select
                name="type"
                value={newClass.type}
                onChange={handleChange}
                style={{
                  padding: "12px 15px",
                  fontSize: "16px",
                  border: "2px solid #1F0741",
                  borderRadius: "10px",
                  backgroundColor: "#FFFBF1"
                }}
              >
                <option value="" disabled>Select type</option>
                <option value="Class">Class</option>
                <option value="Study">Study</option>
                <option value="Workout">Workout</option>
                <option value="Free">Free</option>
              </select>

              <select
                name="day"
                value={newClass.day}
                onChange={handleChange}
                style={{
                  padding: "12px 15px",
                  fontSize: "16px",
                  border: "2px solid #1F0741",
                  borderRadius: "10px",
                  backgroundColor: "#FFFBF1"
                }}
              >
                <option value="" disabled>Select day</option>
                {DAYS.map((d) => <option key={d}>{d}</option>)}
              </select>

              <div style={{ display: "flex", gap: "15px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{
                    display: "block",
                    marginBottom: "8px",
                    color: "#1F0741",
                    fontSize: "14px",
                    fontWeight: "500"
                  }}>
                    Start Time
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    value={newClass.startTime}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "12px 15px",
                      fontSize: "16px",
                      border: "2px solid #1F0741",
                      borderRadius: "10px",
                      backgroundColor: "#FFFBF1"
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{
                    display: "block",
                    marginBottom: "8px",
                    color: "#1F0741",
                    fontSize: "14px",
                    fontWeight: "500"
                  }}>
                    End Time
                  </label>
                  <input
                    type="time"
                    name="endTime"
                    value={newClass.endTime}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "12px 15px",
                      fontSize: "16px",
                      border: "2px solid #1F0741",
                      borderRadius: "10px",
                      backgroundColor: "#FFFBF1"
                    }}
                  />
                </div>
              </div>

              <input
                type="text"
                name="location"
                placeholder="Location"
                value={newClass.location}
                onChange={handleChange}
                style={{
                  padding: "12px 15px",
                  fontSize: "16px",
                  border: "2px solid #1F0741",
                  borderRadius: "10px",
                  backgroundColor: "#FFFBF1"
                }}
              />

              <select
                name="recurring"
                value={newClass.recurring}
                onChange={handleChange}
                style={{
                  padding: "12px 15px",
                  fontSize: "16px",
                  border: "2px solid #1F0741",
                  borderRadius: "10px",
                  backgroundColor: "#FFFBF1"
                }}
              >
                <option value="none">No Recurrence</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
              </select>

              <textarea
                name="description"
                placeholder="Description (optional)"
                value={newClass.description}
                onChange={handleChange}
                rows={3}
                style={{
                  padding: "12px 15px",
                  fontSize: "16px",
                  border: "2px solid #1F0741",
                  borderRadius: "10px",
                  backgroundColor: "#FFFBF1",
                  resize: "vertical"
                }}
              />

              <div style={{
                display: "flex",
                gap: "15px",
                marginTop: "10px",
                justifyContent: "flex-end"
              }}>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingEvent(null);
                    setNewClass({
                      id: crypto.randomUUID(),
                      name: "",
                      day: "",
                      startTime: "",
                      endTime: "",
                      location: "",
                      type: "",
                      recurring: "none",
                      description: "",
                    });
                  }}
                  style={{
                    padding: "12px 24px",
                    fontSize: "16px",
                    border: "3px solid #1F0741",
                    borderRadius: "10px",
                    backgroundColor: "#FFFBF1",
                    color: "#1F0741",
                    cursor: "pointer",
                    fontWeight: "500",
                    boxShadow: "0 3px #1F0741",
                    transform: "translateY(0)",
                    transition: "all 0.2s ease"
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
                  Cancel
                </button>
                <button
                  onClick={editingEvent ? handleUpdateEvent : handleAddClass}
                  style={{
                    padding: "12px 24px",
                    fontSize: "16px",
                    border: "3px solid #1F0741",
                    borderRadius: "10px",
                    backgroundColor: "#ffb703",
                    color: "#1F0741",
                    cursor: "pointer",
                    fontWeight: "500",
                    boxShadow: "0 3px #1F0741",
                    transform: "translateY(0)",
                    transition: "all 0.2s ease"
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
                  {editingEvent ? "Update Event" : "Add Event"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1001
        }}>
          <div style={{
            background: "#FFFBF1",
            padding: "30px",
            borderRadius: "20px",
            border: "3px solid #dc3545",
            width: "400px",
            textAlign: "center",
            boxShadow: "0 20px 60px rgba(220, 53, 69, 0.3)"
          }}>
            <h3 style={{
              margin: "0 0 20px 0",
              color: "#dc3545",
              fontSize: "24px"
            }}>
              Delete Event
            </h3>
            <p style={{
              margin: "0 0 25px 0",
              color: "#1F0741",
              fontSize: "16px"
            }}>
              Are you sure you want to delete this event? This action cannot be undone.
            </p>
            <div style={{
              display: "flex",
              gap: "15px",
              justifyContent: "center"
            }}>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                style={{
                  padding: "10px 20px",
                  fontSize: "16px",
                  border: "2px solid #6c757d",
                  borderRadius: "8px",
                  backgroundColor: "#FFFBF1",
                  color: "#6c757d",
                  cursor: "pointer",
                  fontWeight: "500"
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteEvent(showDeleteConfirm)}
                style={{
                  padding: "10px 20px",
                  fontSize: "16px",
                  border: "2px solid #dc3545",
                  borderRadius: "8px",
                  backgroundColor: "#dc3545",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: "500"
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Planner;
