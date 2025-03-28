// components/WeeklyCalendar.tsx
type WeeklyCalendarProps = {
  events: any[];
};

function WeeklyCalendar({ events }: WeeklyCalendarProps) {
  const grouped: { [key: string]: any[] } = {};

  events.forEach((event) => {
    const day = new Date(event.start_at).toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });

    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(event);
  });

  return (
    <div style={{ backgroundColor: "#f0f0f0", padding: "1rem", borderRadius: "8px" }}>
      <h3>Weekly Calendar</h3>
      {Object.entries(grouped).map(([day, events]) => (
        <div key={day}>
          <h4>{day}</h4>
          {events.map((event: any) => (
            <p key={event.id}>
              {new Date(event.start_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              – {event.title}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}

export default WeeklyCalendar;
