type CalendarProps = {
  events: any[];
};

function WeeklyCalendar({ events }: CalendarProps) {
  const groupedByDay: { [key: string]: any[] } = {};

  events.forEach((event) => {
    const day = new Date(event.start_at).toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });

    if (!groupedByDay[day]) {
      groupedByDay[day] = [];
    }

    groupedByDay[day].push(event);
  });

  return (
    <div style={{ backgroundColor: "#f0f0f0", padding: "1rem", borderRadius: "8px" }}>
      <h3>Weekly Calendar (Live)</h3>
      {Object.entries(groupedByDay).map(([day, events]) => (
        <div key={day}>
          <h4>{day}</h4>
          {events.map((event: any) => (
            <p key={event.id}>
              {new Date(event.start_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              - {event.title}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}

export default WeeklyCalendar;
