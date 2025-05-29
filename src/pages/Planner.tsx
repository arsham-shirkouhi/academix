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
  });

  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      const top = getMinutes(cls.startTime) * (36 / 60) - 18;  // 36px per hour, adjusted for grid offset
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
            borderRadius: "3px",
            padding: "4px 6px",
            fontSize: "11px",
            zIndex: 10,
            border: "1px solid #FFFBF1",
            cursor: "pointer",
            transition: "transform 0.2s ease",
            boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            overflow: "hidden"
          }}
          onClick={() => handleNavigate('/')}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.02)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <strong style={{ fontSize: "12px", marginBottom: "1px" }}>{cls.name}</strong>
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
          <h1 style={{
            fontSize: "42px",
            margin: 0,
            color: "#1F0741",
            fontWeight: "bold"
          }}>
            Weekly Schedule
          </h1>

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
        {/* Calendar */}
        <div style={{
          border: "3px solid #1F0741",
          borderRadius: "16px",
          overflow: "hidden",
          backgroundColor: "#FFFBF1",
          marginBottom: "30px",
          height: "600px",
          display: "flex",
          flexDirection: "column",
          width: "100%"
        }}>
          {/* Calendar Header */}
          <div style={{
            display: "flex",
            background: "#1F0741",
            color: "#FFFBF1",
            position: "sticky",
            top: 0,
            zIndex: 20,
            width: "100%",
          }}>
            <div style={{
              width: "50px",
              borderRight: "1px solid #FFFBF1",
              position: "sticky",
              left: 0,
              zIndex: 21,
              backgroundColor: "#1F0741",
            }}
            />
            {getDatesForWeek().map(({ dayName, date, isToday }) => (
              <div
                key={dayName}
                style={{
                  flex: 1,
                  minWidth: "120px",
                  borderLeft: "1px solid #FFFBF1",
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 8px",
                  backgroundColor: isToday ? "#ffb703" : "transparent",
                  color: isToday ? "#1F0741" : "#FFFBF1",
                }}
              >
                <div style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                }}>
                  <span>{dayName.slice(0, 3)}</span>
                  <span style={{
                    fontSize: "16px",
                    fontWeight: isToday ? "bold" : "500"
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
              width: "50px",
              backgroundColor: "#FFFFFF",
              position: "sticky",
              left: 0,
              zIndex: 15,
              borderRight: "1px solid #ddd"
            }}>
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  style={{
                    position: "relative",
                    height: "36px",
                    fontSize: "11px",
                    color: "#70757a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "500",
                    transform: "translateY(-50%)",
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
                    borderLeft: "1px solid #eee",
                    position: "relative",
                    height: "864px",
                    backgroundImage: `linear-gradient(#eee 1px, transparent 1px)`,
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

        {/* Daily Events List Section */}
        <div style={{
          marginBottom: "30px"
        }}>
          <div style={{
            backgroundColor: "#FFFBF1",
            border: "3px solid #1F0741",
            borderRadius: "16px",
            overflow: "hidden"
          }}>
            <div style={{
              backgroundColor: "#1F0741",
              padding: "15px",
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
                    padding: "8px 12px",
                    fontSize: "16px",
                    backgroundColor: "#FFFBF1",
                    border: "2px solid #1F0741",
                    borderRadius: "8px",
                    color: "#1F0741",
                    cursor: "pointer"
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
                  padding: "8px 12px",
                  fontSize: "16px",
                  backgroundColor: "#FFFBF1",
                  border: "2px solid #1F0741",
                  borderRadius: "8px",
                  width: "200px"
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
                      padding: "15px",
                      backgroundColor: index % 2 === 0 ? "#FFFBF1" : "#f8f8f8",
                      borderBottom: index !== getDayEvents(selectedDay).length - 1 ? "1px solid #ddd" : "none",
                      transition: "transform 0.2s ease",
                      cursor: "pointer"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateX(10px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateX(0)";
                    }}
                  >
                    <div style={{
                      width: "120px",
                      borderRight: "2px solid #1F0741",
                      paddingRight: "15px"
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
                      paddingLeft: "15px",
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
                          color: "#666"
                        }}>
                          📍 {event.location}
                        </div>
                      </div>

                      <div style={{
                        padding: "6px 12px",
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
                    </div>

                    <div style={{
                      marginLeft: "15px",
                      padding: "6px 12px",
                      backgroundColor: "#ffb703",
                      borderRadius: "8px",
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
                  </div>
                ))}

              {getDayEvents(selectedDay).length === 0 && (
                <div style={{
                  padding: "30px",
                  textAlign: "center",
                  color: "#666"
                }}>
                  <p style={{
                    fontSize: "18px",
                    margin: "0 0 15px 0"
                  }}>
                    No events scheduled for {selectedDay}
                  </p>
                  <button
                    onClick={() => setShowForm(true)}
                    style={{
                      padding: "10px 20px",
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
          width: "50px",
          height: "50px",
          fontSize: "24px",
          borderRadius: "10px",
          backgroundColor: "#ffb703",
          color: "#1F0741",
          border: "3px solid #1F0741",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 3px #1F0741",
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
          e.currentTarget.style.boxShadow = "0 3px #1F0741";
        }}
      >
        ＋
      </button>

      {/* Modal Form */}
      {showForm && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "#FFFBF1",
            padding: "25px",
            borderRadius: "16px",
            border: "3px solid #1F0741",
            width: "400px"
          }}>
            <h2 style={{
              margin: "0 0 20px 0",
              color: "#1F0741",
              fontSize: "24px"
            }}>
              Add Event
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <input
                type="text"
                name="name"
                list="course-options"
                placeholder="Event Name"
                value={newClass.name}
                onChange={handleChange}
                style={{
                  padding: "10px",
                  fontSize: "16px",
                  border: "2px solid #1F0741",
                  borderRadius: "8px",
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
                  padding: "10px",
                  fontSize: "16px",
                  border: "2px solid #1F0741",
                  borderRadius: "8px",
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
                  padding: "10px",
                  fontSize: "16px",
                  border: "2px solid #1F0741",
                  borderRadius: "8px",
                  backgroundColor: "#FFFBF1"
                }}
              >
                <option value="" disabled>Select day</option>
                {DAYS.map((d) => <option key={d}>{d}</option>)}
              </select>

              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{
                    display: "block",
                    marginBottom: "5px",
                    color: "#1F0741",
                    fontSize: "14px"
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
                      padding: "10px",
                      fontSize: "16px",
                      border: "2px solid #1F0741",
                      borderRadius: "8px",
                      backgroundColor: "#FFFBF1"
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{
                    display: "block",
                    marginBottom: "5px",
                    color: "#1F0741",
                    fontSize: "14px"
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
                      padding: "10px",
                      fontSize: "16px",
                      border: "2px solid #1F0741",
                      borderRadius: "8px",
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
                  padding: "10px",
                  fontSize: "16px",
                  border: "2px solid #1F0741",
                  borderRadius: "8px",
                  backgroundColor: "#FFFBF1"
                }}
              />

              <div style={{
                display: "flex",
                gap: "10px",
                marginTop: "10px",
                justifyContent: "flex-end"
              }}>
                <button
                  onClick={() => setShowForm(false)}
                  style={{
                    padding: "10px 20px",
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
                  onClick={handleAddClass}
                  style={{
                    padding: "10px 20px",
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
                  Add Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Planner;
