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

  const parsedTime = (day: string, time: string) => {
    const today = new Date();
    const target = new Date(today);
    const weekdayIndex = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday"
    ].indexOf(day);
    const diff = (weekdayIndex + 7 - today.getDay()) % 7;
    target.setDate(today.getDate() + diff);
    const [hours, minutes] = time.split(":").map(Number);
    target.setHours(hours);
    target.setMinutes(minutes);
    target.setSeconds(0);
    return target;
  };

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
      ) : (
        <div style={{ flex: 1, padding: "15px" }}>
          {Object.entries(grouped).map(([day, events]) => (
            <div
              key={day}
              style={{
                marginBottom: events.length > 0 ? "1rem" : 0,
                cursor: "pointer"
              }}
              onClick={() => navigate("/planner")}
            >
              <h4 style={{
                margin: "0 0 0.5rem 0",
                color: "#1F0741",
                fontSize: "16px",
                fontWeight: "bold"
              }}>
                {day}
              </h4>
              {events.map((event: any, index: number) => (
                <p key={event.id} style={{
                  margin: index === events.length - 1 ? 0 : "0.5rem 0",
                  color: "#1F0741",
                  fontSize: "14px"
                }}>
                  {parsedTime(event.day, event.startTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  – {event.name} ({event.location})
                </p>
              ))}
            </div>
          ))}
        </div>
      )}
      {!limitToTodayAndTomorrow && (
        <button
          style={{
            width: "100%",
            height: "35px",
            backgroundColor: "#ffb703",
            border: "2px solid #000",
            borderRadius: "4px",
            fontWeight: "bold",
            fontSize: "14px",
            cursor: "pointer",
            marginTop: "0.25rem",
          }}
          onClick={() => navigate("/planner")}
        >
          View Schedule
        </button>
      )}
    </div>
  );
}

export default WeeklyCalendar;
