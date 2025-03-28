// components/WeeklyCalendar.tsx

type WeeklyCalendarProps = {
  events: any[];
};

function WeeklyCalendar({ events }: WeeklyCalendarProps) {
  const grouped: { [key: string]: any[] } = {};

  // Group by day
  events.forEach((event) => {
    if (!grouped[event.day]) grouped[event.day] = [];
    grouped[event.day].push(event);
  });

  // Function to build a valid Date object from day + time
  const parsedTime = (day: string, time: string) => {
    const today = new Date();
    const target = new Date(today);
    const weekdayIndex = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].indexOf(day);
    const diff = (weekdayIndex + 7 - today.getDay()) % 7;
    target.setDate(today.getDate() + diff);
    const [hours, minutes] = time.split(":").map(Number);
    target.setHours(hours);
    target.setMinutes(minutes);
    target.setSeconds(0);
    return target;
  };

  return (
    <div style={{ backgroundColor: "#f0f0f0", padding: "1rem", borderRadius: "8px" }}>
      <h3>Weekly Calendar</h3>
      {Object.entries(grouped).map(([day, events]) => (
        <div key={day}>
          <h4 style={{ marginTop: "1rem" }}>{day}</h4>
          {events.map((event: any) => (
            <p key={event.id}>
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
  );
}

export default WeeklyCalendar;
