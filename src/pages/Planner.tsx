import { useState, useEffect } from "react";
import { auth } from "../firebase";
import { saveUserSchedule, loadUserSchedule, getUserSettings } from "../utils/firestoreUser";

type ClassEntry = {
  id: string;
  name: string;
  day: string;
  startTime: string;
  endTime: string;
  location: string;
  type: "" | "Class" | "Study" | "Workout" | "Others";
  recurring?: "none" | "weekly" | "biweekly" | "monthly";
  description?: string;
};

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
// 8 AM through 12 AM (midnight). 8..24 inclusive (17 entries)
const HOURS = Array.from({ length: 17 }, (_, i) => {
  const hour = i + 8; // Start from 8 AM
  if (hour === 24) return "12 AM";
  if (hour === 12) return "12 PM";
  return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
});
const ROW_HEIGHT = 36; // px height per hour row

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
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [editingEvent, setEditingEvent] = useState<ClassEntry | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [viewEvent, setViewEvent] = useState<ClassEntry | null>(null);


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
      selectedDays.length === 0 ||
      !newClass.startTime ||
      !newClass.endTime ||
      !newClass.location ||
      !newClass.type
    ) {
      alert("Please fill in all fields and select at least one day before adding the event.");
      return;
    }

    const newEvents = selectedDays.map(day => ({
      ...newClass,
      id: crypto.randomUUID(),
      day: day
    }));

    const updated = [...schedule, ...newEvents];
    setSchedule(updated);

    const user = auth.currentUser;
    if (user) await saveUserSchedule(user.uid, updated);

    setShowForm(false);
    setSelectedDays([]);
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
    setSelectedDays([]);
    setShowForm(true);
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent) return;

    if (
      !newClass.name ||
      !newClass.startTime ||
      !newClass.endTime ||
      !newClass.location ||
      !newClass.type
    ) {
      alert("Please fill in all fields before updating the event.");
      return;
    }

    const updated = schedule.map(event =>
      event.id === editingEvent.id ? { ...newClass, id: editingEvent.id, day: editingEvent.day } : event
    );
    setSchedule(updated);

    const user = auth.currentUser;
    if (user) await saveUserSchedule(user.uid, updated);

    setShowForm(false);
    setEditingEvent(null);
    setSelectedDays([]);
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


  const getEventColor = (type: string) => {
    switch (type) {
      case "Class": return "#1F0741";
      case "Study": return "#2a0a5a";
      case "Workout": return "#8B4513";
      case "Others": return "#556B2F";
      default: return "#1F0741";
    }
  };

  const handleDayToggle = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
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
    <div style={{ height: "100vh", boxSizing: "border-box", display: "flex", flexDirection: "column", padding: "15px 15px 15px 15px" }}>
      <style>
        {`
          @keyframes fadeInUp {
            0% { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
      {/* Header */}
      <div style={{ marginBottom: 0 }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 0
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <h1 style={{
              fontSize: "42px",
              margin: 0,
              color: "#1F0741",
              fontWeight: "900"
            }}>
              Weekly Schedule
            </h1>
          </div>

          {/* Statistics Cards */}
          <div style={{
            display: "flex",
            gap: "15px",
            alignItems: "center"
          }}>
            {[
              { type: "Class", color: "#1F0741" },
              { type: "Study", color: "#2a0a5a" },
              { type: "Workout", color: "#8B4513" },
              { type: "Others", color: "#556B2F" }
            ].map(({ type, color }) => {
              const hours = schedule.filter(event => event.type === type)
                .reduce((total, event) => {
                  const start = new Date(`2000-01-01T${event.startTime}`);
                  const end = new Date(`2000-01-01T${event.endTime}`);
                  return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                }, 0).toFixed(1);

              return (
                <div
                  key={type}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    backgroundColor: "#FFFBF1",
                    border: `3px solid ${color}`,
                    borderRadius: "12px",
                    padding: "10px 15px"
                  }}
                >
                  <span style={{ color: "#1F0741", fontWeight: "600" }}>{type}:</span>
                  <span style={{ color, fontWeight: "bold", fontSize: "16px" }}>
                    {hours}h
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "visible", width: "100%", paddingRight: 0, paddingLeft: 0, paddingTop: "10px", paddingBottom: "10px", scrollBehavior: "smooth", position: "relative" }}>
        {/* Weekly Calendar */}
        <div style={{
          backgroundColor: "#FFFBF1",
          border: "3px solid #1F0741",
          borderRadius: "10px",
          overflow: "hidden",
          animation: "fadeInUp 0.5s ease forwards",
          opacity: 0
        }}>
          {/* Calendar Header */}
          <div style={{
            display: "flex",
            background: "linear-gradient(135deg, #1F0741 0%, #2a0a5a 100%)",
            color: "#FFFBF1",
            padding: "8px 0",
            alignItems: "center"
          }}>
            <div style={{
              width: "80px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700",
              fontSize: "13px"
            }}>
              Time
            </div>
            {getDatesForWeek().map(({ dayName, date, isToday }) => (
              <div
                key={dayName}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "6px 0",
                  backgroundColor: isToday ? "#ffb703" : "transparent",
                  color: isToday ? "#1F0741" : "#FFFBF1",
                  borderRadius: "8px",
                  margin: "0 5px"
                }}
              >
                <div style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  letterSpacing: 0.2
                }}>
                  {`${dayName.slice(0, 3)}, ${date}`}
                </div>
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div style={{
            height: `${HOURS.length * ROW_HEIGHT}px`,
            overflowY: "hidden",
            position: "relative"
          }}>
            <div style={{
              display: "flex",
              minHeight: `${HOURS.length * ROW_HEIGHT}px`
            }}>
              {/* Time Column */}
              <div style={{
                width: "80px",
                backgroundColor: "#f8f9fa",
                borderRight: "2px solid #e9ecef",
                position: "sticky",
                left: 0,
                zIndex: 10
              }}>
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    style={{
                      height: `${ROW_HEIGHT}px`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      color: "#6c757d",
                      fontWeight: "600",
                      borderBottom: "1px solid #e9ecef",
                      backgroundColor: "#f8f9fa"
                    }}
                  >
                    {hour}
                  </div>
                ))}
              </div>

              {/* Day Columns */}
              {DAYS.map((day) => (
                <div
                  key={day}
                  style={{
                    flex: 1,
                    position: "relative",
                    backgroundColor: "#FFFFFF",
                    borderRight: "1px solid #e9ecef"
                  }}
                >
                  {/* Hour Grid Lines */}
                  {HOURS.map((_, index) => (
                    <div
                      key={index}
                      style={{
                        position: "absolute",
                        top: `${index * ROW_HEIGHT}px`,
                        left: 0,
                        right: 0,
                        height: "1px",
                        backgroundColor: "#e9ecef",
                        zIndex: 1
                      }}
                    />
                  ))}

                  {/* Events */}
                  {schedule
                    .filter(event => event.day === day)
                    .map((event) => {
                      const startMinutes = parseInt(event.startTime.split(':')[0]) * 60 + parseInt(event.startTime.split(':')[1]);
                      let endMinutes = parseInt(event.endTime.split(':')[0]) * 60 + parseInt(event.endTime.split(':')[1]);
                      // If event ends exactly at 00:00, treat it as 24:00 so it reaches bottom
                      if (event.endTime === "00:00") {
                        endMinutes = 24 * 60;
                      }
                      // Adjust for 8 AM start time (8 AM = 0, 9 AM = 1, etc.)
                      const adjustedStartHour = (startMinutes / 60) - 8;
                      const adjustedEndHour = (endMinutes / 60) - 8;
                      const top = Math.max(0, adjustedStartHour * 36);
                      const height = Math.max(0, (adjustedEndHour - adjustedStartHour) * 36);

                      return (
                        <div
                          key={event.id}
                          style={{
                            position: "absolute",
                            top: `${top}px`,
                            left: "4px",
                            right: "4px",
                            height: `${height}px`,
                            backgroundColor: getEventColor(event.type),
                            color: "#FFFBF1",
                            borderRadius: "6px",
                            padding: "6px 8px",
                            fontSize: "11px",
                            zIndex: 5,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            overflow: "hidden"
                          }}
                          onClick={() => setViewEvent(event)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "scale(1.02)";
                            e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1)";
                            e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
                          }}
                        >
                          <div style={{
                            fontWeight: "bold",
                            fontSize: "12px",
                            marginBottom: "2px",
                            lineHeight: "1.2",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px"
                          }}>
                            {event.name}
                          </div>
                          <div style={{
                            fontSize: "10px",
                            opacity: 0.9
                          }}>
                            {event.startTime} - {event.endTime}
                          </div>
                          {event.location && (
                            <div style={{
                              fontSize: "9px",
                              opacity: 0.8
                            }}>
                              📍 {event.location}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Daily Schedule Section */}
        <div style={{
          backgroundColor: "#FFFBF1",
          border: "3px solid #1F0741",
          borderRadius: "10px",
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(31, 7, 65, 0.15)",
          animation: "fadeInUp 0.5s ease forwards",
          opacity: 0
        }}>
          {/* Section Header */}
          <div style={{
            background: "linear-gradient(135deg, #1F0741 0%, #2a0a5a 100%)",
            padding: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
              <h2 style={{
                margin: 0,
                color: "#FFFBF1",
                fontSize: "28px",
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
                  border: "3px solid #1F0741",
                  borderRadius: "10px",
                  color: "#1F0741",
                  cursor: "pointer",
                  fontWeight: "600",
                  boxShadow: "0 3px #1F0741"
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
                padding: "12px 15px",
                fontSize: "16px",
                backgroundColor: "#FFFBF1",
                border: "3px solid #1F0741",
                borderRadius: "10px",
                width: "250px",
                fontWeight: "500"
              }}
            />
          </div>

          {/* Events List */}
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
                    borderBottom: index !== getDayEvents(selectedDay).length - 1 ? "2px solid #e9ecef" : "none",
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                    borderRadius: "12px",
                    marginBottom: "10px",
                    border: "2px solid transparent",
                    opacity: 0,
                    animation: `fadeInUp 0.4s ease forwards ${index * 0.04}s`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateX(10px)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(31, 7, 65, 0.1)";
                    e.currentTarget.style.borderColor = getEventColor(event.type);
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateX(0)";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.borderColor = "transparent";
                  }}
                  onClick={() => setViewEvent(event)}
                >
                  {/* Time Column */}
                  <div style={{
                    width: "140px",
                    borderRight: "3px solid #1F0741",
                    paddingRight: "20px"
                  }}>
                    <div style={{
                      fontSize: "20px",
                      fontWeight: "bold",
                      color: "#1F0741"
                    }}>
                      {event.startTime} - {event.endTime}
                    </div>
                    <div style={{
                      fontSize: "14px",
                      color: "#666",
                      marginTop: "5px"
                    }}>
                      {(() => {
                        const start = new Date(`2000-01-01T${event.startTime}`);
                        const end = new Date(`2000-01-01T${event.endTime}`);
                        const diff = (end.getTime() - start.getTime()) / (1000 * 60);
                        return `${diff} minutes`;
                      })()}
                    </div>
                  </div>

                  {/* Event Details */}
                  <div style={{
                    flex: 1,
                    paddingLeft: "20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    <div>
                      <div style={{
                        fontSize: "20px",
                        fontWeight: "bold",
                        color: "#1F0741",
                        marginBottom: "8px"
                      }}>
                        {event.name}
                      </div>
                      <div style={{
                        fontSize: "16px",
                        color: "#666",
                        marginBottom: "5px"
                      }}>
                        📍 {event.location}
                      </div>
                      {event.description && (
                        <div style={{
                          fontSize: "14px",
                          color: "#888",
                          fontStyle: "italic"
                        }}>
                          {event.description}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "15px"
                    }}>
                      <div style={{
                        padding: "10px 20px",
                        borderRadius: "25px",
                        fontSize: "14px",
                        fontWeight: "600",
                        backgroundColor: getEventColor(event.type),
                        color: "#FFFBF1",
                        border: "2px solid #1F0741"
                      }}>
                        {event.type}
                      </div>

                      {event.recurring && event.recurring !== "none" && (
                        <div style={{
                          padding: "8px 16px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "600",
                          backgroundColor: "#ffb703",
                          color: "#1F0741",
                          border: "2px solid #1F0741"
                        }}>
                          {event.recurring}
                        </div>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteConfirm(event.id);
                        }}
                        style={{
                          padding: "10px 15px",
                          backgroundColor: "#dc3545",
                          color: "white",
                          border: "3px solid #dc3545",
                          borderRadius: "10px",
                          cursor: "pointer",
                          fontSize: "16px",
                          fontWeight: "600",
                          transition: "all 0.2s ease",
                          boxShadow: "0 3px #dc3545"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(2px)";
                          e.currentTarget.style.boxShadow = "0 0 #dc3545";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "0 3px #dc3545";
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
                padding: "60px",
                textAlign: "center",
                color: "#666"
              }}>
                <div style={{
                  fontSize: "48px",
                  marginBottom: "20px"
                }}>
                  📅
                </div>
                <p style={{
                  fontSize: "20px",
                  margin: "0 0 30px 0",
                  color: "#1F0741",
                  fontWeight: "600"
                }}>
                  No events scheduled for {selectedDay}
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  style={{
                    padding: "15px 30px",
                    fontSize: "18px",
                    backgroundColor: "#ffb703",
                    color: "#1F0741",
                    border: "3px solid #1F0741",
                    borderRadius: "12px",
                    cursor: "pointer",
                    fontWeight: "600",
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

      {/* Add Event Button */}
      <button
        onClick={() => setShowForm(true)}
        style={{
          position: "fixed",
          bottom: "30px",
          right: "30px",
          width: "70px",
          height: "70px",
          fontSize: "32px",
          borderRadius: "20px",
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
          background: "rgba(0,0,0,0.7)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "#FFFBF1",
            padding: "40px",
            borderRadius: "20px",
            border: "3px solid #1F0741",
            width: "550px",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 20px 60px rgba(31, 7, 65, 0.3)"
          }}>
            <h2 style={{
              margin: "0 0 30px 0",
              color: "#1F0741",
              fontSize: "32px",
              textAlign: "center",
              fontWeight: "bold"
            }}>
              {editingEvent ? "Edit Event" : "Add New Event"}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
              <input
                type="text"
                name="name"
                list="course-options"
                placeholder="Event Name"
                value={newClass.name}
                onChange={handleChange}
                style={{
                  padding: "15px 20px",
                  fontSize: "16px",
                  border: "3px solid #1F0741",
                  borderRadius: "12px",
                  backgroundColor: "#FFFBF1",
                  fontWeight: "500"
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
                  padding: "15px 20px",
                  fontSize: "16px",
                  border: "3px solid #1F0741",
                  borderRadius: "12px",
                  backgroundColor: "#FFFBF1",
                  fontWeight: "500"
                }}
              >
                <option value="" disabled>Select Event Type</option>
                <option value="Class">Class</option>
                <option value="Study">Study</option>
                <option value="Workout">Workout</option>
                <option value="Others">Others</option>
              </select>

              {!editingEvent && (
                <div>
                  <label style={{
                    display: "block",
                    marginBottom: "15px",
                    color: "#1F0741",
                    fontSize: "16px",
                    fontWeight: "600"
                  }}>
                    Select Days
                  </label>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                    gap: "10px"
                  }}>
                    {DAYS.map((day) => (
                      <label
                        key={day}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "12px 15px",
                          backgroundColor: selectedDays.includes(day) ? "#ffb703" : "#FFFBF1",
                          border: `3px solid ${selectedDays.includes(day) ? "#1F0741" : "#e9ecef"}`,
                          borderRadius: "10px",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          fontWeight: "500",
                          color: selectedDays.includes(day) ? "#1F0741" : "#666"
                        }}
                        onMouseEnter={(e) => {
                          if (!selectedDays.includes(day)) {
                            e.currentTarget.style.backgroundColor = "#f8f9fa";
                            e.currentTarget.style.borderColor = "#1F0741";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!selectedDays.includes(day)) {
                            e.currentTarget.style.backgroundColor = "#FFFBF1";
                            e.currentTarget.style.borderColor = "#e9ecef";
                          }
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedDays.includes(day)}
                          onChange={() => handleDayToggle(day)}
                          style={{
                            width: "18px",
                            height: "18px",
                            accentColor: "#1F0741"
                          }}
                        />
                        {day}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: "20px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{
                    display: "block",
                    marginBottom: "10px",
                    color: "#1F0741",
                    fontSize: "16px",
                    fontWeight: "600"
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
                      padding: "15px 20px",
                      fontSize: "16px",
                      border: "3px solid #1F0741",
                      borderRadius: "12px",
                      backgroundColor: "#FFFBF1",
                      fontWeight: "500"
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{
                    display: "block",
                    marginBottom: "10px",
                    color: "#1F0741",
                    fontSize: "16px",
                    fontWeight: "600"
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
                      padding: "15px 20px",
                      fontSize: "16px",
                      border: "3px solid #1F0741",
                      borderRadius: "12px",
                      backgroundColor: "#FFFBF1",
                      fontWeight: "500"
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
                  padding: "15px 20px",
                  fontSize: "16px",
                  border: "3px solid #1F0741",
                  borderRadius: "12px",
                  backgroundColor: "#FFFBF1",
                  fontWeight: "500"
                }}
              />

              <select
                name="recurring"
                value={newClass.recurring}
                onChange={handleChange}
                style={{
                  padding: "15px 20px",
                  fontSize: "16px",
                  border: "3px solid #1F0741",
                  borderRadius: "12px",
                  backgroundColor: "#FFFBF1",
                  fontWeight: "500"
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
                rows={4}
                style={{
                  padding: "15px 20px",
                  fontSize: "16px",
                  border: "3px solid #1F0741",
                  borderRadius: "12px",
                  backgroundColor: "#FFFBF1",
                  resize: "vertical",
                  fontWeight: "500"
                }}
              />

              <div style={{
                display: "flex",
                gap: "20px",
                marginTop: "20px",
                justifyContent: "flex-end"
              }}>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingEvent(null);
                    setSelectedDays([]);
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
                    padding: "15px 30px",
                    fontSize: "16px",
                    border: "3px solid #1F0741",
                    borderRadius: "12px",
                    backgroundColor: "#FFFBF1",
                    color: "#1F0741",
                    cursor: "pointer",
                    fontWeight: "600",
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
                    padding: "15px 30px",
                    fontSize: "16px",
                    border: "3px solid #1F0741",
                    borderRadius: "12px",
                    backgroundColor: "#ffb703",
                    color: "#1F0741",
                    cursor: "pointer",
                    fontWeight: "600",
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
          background: "rgba(0,0,0,0.7)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1001
        }}>
          <div style={{
            background: "#FFFBF1",
            padding: "40px",
            borderRadius: "20px",
            border: "3px solid #dc3545",
            width: "450px",
            textAlign: "center",
            boxShadow: "0 20px 60px rgba(220, 53, 69, 0.3)"
          }}>
            <div style={{
              fontSize: "48px",
              marginBottom: "20px"
            }}>
              ⚠️
            </div>
            <h3 style={{
              margin: "0 0 20px 0",
              color: "#dc3545",
              fontSize: "28px",
              fontWeight: "bold"
            }}>
              Delete Event
            </h3>
            <p style={{
              margin: "0 0 30px 0",
              color: "#1F0741",
              fontSize: "16px",
              lineHeight: "1.5"
            }}>
              Are you sure you want to delete this event? This action cannot be undone.
            </p>
            <div style={{
              display: "flex",
              gap: "20px",
              justifyContent: "center"
            }}>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                style={{
                  padding: "12px 25px",
                  fontSize: "16px",
                  border: "3px solid #6c757d",
                  borderRadius: "10px",
                  backgroundColor: "#FFFBF1",
                  color: "#6c757d",
                  cursor: "pointer",
                  fontWeight: "600",
                  boxShadow: "0 3px #6c757d",
                  transform: "translateY(0)",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(2px)";
                  e.currentTarget.style.boxShadow = "0 0 #6c757d";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 3px #6c757d";
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteEvent(showDeleteConfirm)}
                style={{
                  padding: "12px 25px",
                  fontSize: "16px",
                  border: "3px solid #dc3545",
                  borderRadius: "10px",
                  backgroundColor: "#dc3545",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: "600",
                  boxShadow: "0 3px #dc3545",
                  transform: "translateY(0)",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(2px)";
                  e.currentTarget.style.boxShadow = "0 0 #dc3545";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 3px #dc3545";
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Event Modal */}
      {viewEvent && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0,0,0,0.7)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1002
        }}>
          <div style={{
            background: "#FFFBF1",
            padding: "32px",
            borderRadius: "16px",
            border: "3px solid #1F0741",
            width: "520px",
            boxShadow: "0 20px 60px rgba(31, 7, 65, 0.3)"
          }}>
            <h3 style={{
              margin: 0,
              marginBottom: "20px",
              color: "#1F0741",
              fontSize: "28px",
              fontWeight: 700
            }}>{viewEvent.name}</h3>
            <div style={{ color: "#1F0741", lineHeight: 1.7 }}>
              <div><strong>Type:</strong> {viewEvent.type}</div>
              <div><strong>Day:</strong> {viewEvent.day}</div>
              <div><strong>Time:</strong> {viewEvent.startTime} - {viewEvent.endTime}</div>
              {viewEvent.location && <div><strong>Location:</strong> {viewEvent.location}</div>}
              {viewEvent.description && <div><strong>Description:</strong> {viewEvent.description}</div>}
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}>
              <button
                onClick={() => { setViewEvent(null); setShowDeleteConfirm(viewEvent.id); }}
                style={{
                  padding: "10px 18px",
                  fontSize: "15px",
                  border: "3px solid #dc3545",
                  borderRadius: "10px",
                  backgroundColor: "#dc3545",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 600
                }}
              >
                Delete
              </button>
              <button
                onClick={() => setViewEvent(null)}
                style={{
                  padding: "10px 18px",
                  fontSize: "15px",
                  border: "3px solid #1F0741",
                  borderRadius: "10px",
                  backgroundColor: "#FFFBF1",
                  color: "#1F0741",
                  cursor: "pointer",
                  fontWeight: 600
                }}
              >
                Close
              </button>
              <button
                onClick={() => { setViewEvent(null); handleEditEvent(viewEvent); }}
                style={{
                  padding: "10px 18px",
                  fontSize: "15px",
                  border: "3px solid #1F0741",
                  borderRadius: "10px",
                  backgroundColor: "#ffb703",
                  color: "#1F0741",
                  cursor: "pointer",
                  fontWeight: 600
                }}
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Planner;
