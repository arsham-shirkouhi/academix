import { useEffect, useState } from "react";

type DashboardHeaderProps = {
  events: any[];
  userName?: string; // Optional for now
};

function DashboardHeader({ events, userName = "Arsham" }: DashboardHeaderProps) {
  const [assignmentsDueTomorrow, setAssignmentsDueTomorrow] = useState(0);
  const [nextExamInDays, setNextExamInDays] = useState<number | null>(null);
  const [currentWeek, setCurrentWeek] = useState(0);

  // Set a hardcoded semester start date for now (adjust as needed)
  const semesterStart = new Date("2025-01-22"); // e.g. Spring 2025
  const totalWeeks = 15;

  useEffect(() => {
    const today = new Date();
  
    let dueTomorrowCount = 0;
    let upcomingExamDays: number[] = [];
  
    events.forEach((event) => {
      const rawDate = event.due_at || event.start_at;
      if (!rawDate) return;
  
      const eventDate = new Date(rawDate);
      const diff = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
      if (diff === 1) dueTomorrowCount++;
  
      // Check for exams
      const title = event.title.toLowerCase();
      if (title.includes("exam") || title.includes("quiz") || title.includes("midterm") || title.includes("test")) {
        if (diff >= 0) upcomingExamDays.push(diff);
      }
    });
  
    setAssignmentsDueTomorrow(dueTomorrowCount);
    setNextExamInDays(upcomingExamDays.length > 0 ? Math.min(...upcomingExamDays) : null);
  
    // Calculate week number
    const timeDiff = today.getTime() - semesterStart.getTime();
    const weekNumber = Math.floor(timeDiff / (1000 * 60 * 60 * 24 * 7)) + 1;
    setCurrentWeek(weekNumber > 0 ? weekNumber : 0);
  }, [events]);
  

  const formattedDate = new Date().toLocaleDateString();

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", paddingBottom: "1.5rem" }}>
      <div>
        <h2 style={{ marginBottom: "0.5rem", color: "#21003b" }}>
          Welcome back, {userName}!
        </h2>
        <p style={{ margin: 0, fontSize: "1rem", color: "#21003b" }}>
          You have <strong>{assignmentsDueTomorrow}</strong> assignment{assignmentsDueTomorrow !== 1 && "s"} due tomorrow
          {nextExamInDays !== null && (
            <> and an <strong>exam</strong> in {nextExamInDays} day{nextExamInDays !== 1 && "s"}</>
          )}.
          <span style={{ marginLeft: "0.25rem", fontWeight: "bold", cursor: "pointer" }}>view ➜</span>
        </p>
      </div>

      <div style={{ textAlign: "right", color: "#21003b" }}>
        <p style={{ margin: 0 }}>{formattedDate}</p>
        <p style={{ margin: 0 }}>
          <strong>week {currentWeek}/{totalWeeks}</strong>
        </p>
      </div>
    </div>
  );
}

export default DashboardHeader;
