type ClassItem = {
    day: string;
    time: string;
    subject: string;
    location: string;
  };
  
  const weeklySchedule: ClassItem[] = [
    {
      day: "Monday, March 18",
      time: "12:00PM - 12:50PM",
      subject: "ENGR10",
      location: "Morris Dalley - Comp Sci Building",
    },
    {
      day: "Monday, March 18",
      time: "1:30PM - 2:45PM",
      subject: "CS46B",
      location: "Comp Sci Building",
    },
    {
      day: "Tuesday, March 19",
      time: "9:00AM - 11:45AM",
      subject: "ENGR10",
      location: "Engineering Building",
    },
    {
      day: "Tuesday, March 19",
      time: "12:00PM - 1:15PM",
      subject: "PHYS51",
      location: "Fugihiro Yoshida - Engineering Building",
    },
    {
      day: "Wednesday, March 20",
      time: "12:00PM - 12:50PM",
      subject: "ENGR10",
      location: "Engineering Building",
    },
    {
      day: "Wednesday, March 20",
      time: "1:30PM - 2:45PM",
      subject: "CS46B",
      location: "Comp Sci Building",
    },
  ];
  
  function WeeklyCalendar() {
    return (
      <div
        style={{
          backgroundColor: "#f0f0f0",
          padding: "1rem",
          borderRadius: "8px",
          height: "250px", // 📏 Set height
          overflowY: "auto", // 🔄 Enable vertical scroll
        }}
      >
        <h3 style={{ marginBottom: "1rem" }}>Weekly Calendar</h3>
        {weeklySchedule.map((item, index) => (
          <div key={index} style={{ marginBottom: "1rem" }}>
            <strong>{item.day}</strong>
            <div>{item.time} | {item.subject}</div>
            <small>{item.location}</small>
            <hr />
          </div>
        ))}
      </div>
    );
  }
  
  
  export default WeeklyCalendar;
  