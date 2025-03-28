import { useEffect, useState } from "react";
import { fetchUserProfile } from "../utils/canvasApi";

type DashboardHeaderProps = {
  events: any[];
  token: string;
  domain: string;
};

function DashboardHeader({ events, token, domain }: DashboardHeaderProps) {
  const [userName, setUserName] = useState("Student");
  const [assignmentsDueTomorrow, setAssignmentsDueTomorrow] = useState(0);
  const [nextExamInDays, setNextExamInDays] = useState<number | null>(null);
  const [currentWeek, setCurrentWeek] = useState(0);

  const semesterStart = new Date("2025-01-22");
  const totalWeeks = 15;

  // 📌 Fetch user's name
  useEffect(() => {
    if (!token || !domain) return;
  
    fetchUserProfile(token, domain)
      .then((data) => {
        console.log("Canvas profile data:", data); // 👀 check this
        if (data.name) setUserName(data.name);
      })
      .catch((err) => {
        console.error("Failed to fetch user profile:", err);
      });
        }, [token, domain]);
  

  // 📌 Analyze upcoming events
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

      const title = event.title.toLowerCase();
      if (title.includes("exam") || title.includes("quiz") || title.includes("midterm") || title.includes("test")) {
        if (diff >= 0) upcomingExamDays.push(diff);
      }
    });

    setAssignmentsDueTomorrow(dueTomorrowCount);
    setNextExamInDays(upcomingExamDays.length > 0 ? Math.min(...upcomingExamDays) : null);

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
