import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { fetchUserProfile, fetchUpcomingEvents } from "../utils/canvasApi";

function DashboardHeader() {
  const [userName, setUserName] = useState("Student");
  const [assignmentsDueTomorrow, setAssignmentsDueTomorrow] = useState(0);
  const [currentWeek, setCurrentWeek] = useState(0);

  const totalWeeks = 15;

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const docRef = doc(db, "users", user.uid);
      const snap = await getDoc(docRef);

      if (!snap.exists()) return console.warn("⚠️ No user data found.");
      const { token, domain, semesterStart: semesterStartStr } = snap.data();

      if (!token || !domain) return console.warn("⚠️ Missing token or domain.");

      try {
        const profile = await fetchUserProfile(token, domain);
        if (profile?.name) setUserName(profile.name);
      } catch (err) {
        console.error("❌ Failed to fetch Canvas profile:", err);
      }

      try {
        const events = await fetchUpcomingEvents(token, domain);
        const today = new Date();
        let dueTomorrow = 0;
        const dueTomorrowTitles: string[] = [];

        events.forEach((event: any) => {
          const dateStr = event.due_at || event.start_at;
          if (!dateStr) return;

          const eventDate = new Date(dateStr);
          const diff = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          if (diff === 1) {
            dueTomorrow++;
            dueTomorrowTitles.push(event.title);
          }
        });

        console.log("📋 Assignments due tomorrow:", dueTomorrowTitles);
        setAssignmentsDueTomorrow(dueTomorrow);
      } catch (err) {
        console.error("❌ Failed to fetch Canvas assignments:", err);
      }

      // 📌 Calculate current week (no need to save semesterStart in state)
      if (semesterStartStr) {
        const parsedStart = new Date(semesterStartStr);
        if (!isNaN(parsedStart.getTime())) {
          const now = new Date();
          const week = Math.floor((now.getTime() - parsedStart.getTime()) / (1000 * 60 * 60 * 24 * 7)) + 1;
          setCurrentWeek(week > 0 ? week : 0);
        }
      }
    };

    fetchData();
  }, []);

  const formattedDate = new Date().toLocaleDateString();

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", paddingBottom: "1.5rem" }}>
      <div>
        <h2 style={{ fontSize: "42px", marginBottom: "0.5rem", color: "#21003b" }}>
          Welcome back, {userName}!
        </h2>
        <p style={{ margin: 0, fontSize: "24px", color: "#21003b" }}>
          You have <strong>{assignmentsDueTomorrow}</strong> assignment{assignmentsDueTomorrow !== 1 && "s"} due tomorrow
          <span style={{ marginLeft: "0.25rem", fontWeight: "bold", cursor: "pointer" }}> view ➜</span>
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
