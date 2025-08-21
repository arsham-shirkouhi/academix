// components/WeeklyCalendar.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { loadUserSchedule } from "../utils/firestoreUser";

type WeeklyCalendarProps = {
  limitToTodayAndTomorrow?: boolean;
};

function WeeklyCalendar({ limitToTodayAndTomorrow = false }: WeeklyCalendarProps) {
  const [events, setEvents] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSchedule = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const allEvents = await loadUserSchedule(user.uid);

      if (limitToTodayAndTomorrow) {
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        const formatDay = (date: Date) =>
          date.toLocaleDateString("en-US", { weekday: "long" });
        const todayName = formatDay(today);
        const tomorrowName = formatDay(tomorrow);

        const filtered = allEvents.filter(
          (e) => e.day === todayName || e.day === tomorrowName
        );

        setEvents(filtered);
      } else {
        // For the 7-day view, always show all recurring events
        setEvents(allEvents);
      }
    };

    fetchSchedule();
  }, [limitToTodayAndTomorrow]);

  const grouped: { [key: string]: any[] } = {};
  events.forEach((event) => {
    if (!grouped[event.day]) grouped[event.day] = [];
    grouped[event.day].push(event);
  });

  const parsedTime = (day: string, time: string, targetDate?: Date) => {
    const baseDate = targetDate || new Date();
    const target = new Date(baseDate);
    const weekdayIndex = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday"
    ].indexOf(day);
    const diff = (weekdayIndex + 7 - baseDate.getDay()) % 7;
    target.setDate(baseDate.getDate() + diff);
    const [hours, minutes] = time.split(":").map(Number);
    target.setHours(hours);
    target.setMinutes(minutes);
    target.setSeconds(0);
    return target;
  };

  // Generate array of next 7 days starting from today
  const getNextSevenDays = () => {
    const days = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayName = date.toLocaleDateString("en-US", { weekday: "long" });

      // Get events for this specific day (recurring events)
      const dayEvents = (grouped[dayName] || []).map(event => ({
        ...event,
        // Create a new date for this specific occurrence
        occurrenceDate: new Date(date)
      })).sort((a, b) => {
        const timeA = parsedTime(a.day, a.startTime, date).getTime();
        const timeB = parsedTime(b.day, b.startTime, date).getTime();
        return timeA - timeB;
      });

      days.push({
        date: date,
        dayName: dayName,
        events: dayEvents
      });
    }

    return days;
  };

  const nextSevenDays = getNextSevenDays();

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {limitToTodayAndTomorrow && Object.keys(grouped).length === 0 ? (
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "15px"
        }}>
          <p style={{
            color: "#555",
            textAlign: "center",
            marginBottom: "1rem",
            margin: 0
          }}>
            📭 You have no events scheduled for today or tomorrow.
          </p>
          <button
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#2200ff",
              color: "#FFFBF1",
              fontSize: "1rem",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginTop: "1rem"
            }}
            onClick={() => navigate("/planner")}
          >
            ➕ Add Weekly Schedule
          </button>
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "15px"
        }}>
          <p style={{
            color: "#555",
            textAlign: "center",
            marginBottom: "1rem",
            margin: 0
          }}>
            📭 You have no recurring events scheduled.
          </p>
          <button
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#2200ff",
              color: "#FFFBF1",
              fontSize: "1rem",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginTop: "1rem"
            }}
            onClick={() => navigate("/planner")}
          >
            ➕ Add Weekly Schedule
          </button>
        </div>
      ) : (
        <div
          className="no-scrollbar"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "8px"
          }}
        >
          {nextSevenDays.map(({ dayName, events, date }, index) => {
            const isToday = date.toDateString() === new Date().toDateString();
            const isTomorrow = date.toDateString() === new Date(Date.now() + 86400000).toDateString();

            return (
              <div key={dayName}>
                <div
                  style={{
                    cursor: "pointer",
                    padding: "8px 0",
                    marginBottom: "0.75rem"
                  }}
                  onClick={() => navigate("/planner")}
                >
                  <h4 style={{
                    margin: "0 0 0.5rem 0",
                    color: "#1F0741",
                    fontSize: "22px",
                    fontWeight: "bold",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    {dayName}
                    {isToday && <span style={{ fontSize: "16px", color: "#FFB800", fontWeight: "600" }}>• Today</span>}
                    {isTomorrow && <span style={{ fontSize: "16px", color: "#FFB800", fontWeight: "600" }}>• Tomorrow</span>}
                  </h4>
                  {events.length > 0 ? (
                    <div style={{ paddingLeft: "8px" }}>
                      {events.map((event: any, eventIndex: number) => (
                        <div key={event.id} style={{
                          margin: eventIndex === events.length - 1 ? 0 : "0.5rem 0",
                          color: "#1F0741",
                          fontSize: "16px",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "8px",
                          padding: "4px 8px",
                          backgroundColor: "rgba(255, 255, 255, 0.5)",
                          borderRadius: "6px",
                          border: "1px solid rgba(31, 7, 65, 0.1)"
                        }}>
                          <span style={{
                            color: "#FFB800",
                            fontSize: "14px",
                            minWidth: "45px",
                            marginTop: "2px",
                            fontWeight: "600",
                            backgroundColor: "rgba(255, 184, 0, 0.1)",
                            padding: "2px 4px",
                            borderRadius: "4px",
                            textAlign: "center"
                          }}>
                            {parsedTime(event.day, event.startTime, date).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span>
                            {event.name} ({event.location})
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{
                      margin: 0,
                      color: "#888",
                      fontSize: "14px",
                      fontStyle: "italic"
                    }}>
                      No events scheduled
                    </p>
                  )}
                </div>
                {/* Add dashed line partition between days (except after the last day) */}
                {index < nextSevenDays.length - 1 && (
                  <div style={{
                    height: "3px",
                    background: "repeating-linear-gradient(to right, #1F0741 0, #1F0741 6px, transparent 6px, transparent 12px)",
                    margin: "1rem 0",
                    opacity: 0.8
                  }} />
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

export default WeeklyCalendar;
