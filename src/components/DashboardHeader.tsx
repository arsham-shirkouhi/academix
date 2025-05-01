import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { fetchUpcomingEvents } from "../utils/canvasApi";
import { useNavigate } from "react-router-dom"; // 👈 ADD THIS

function DashboardHeader() {
  const [userName, setUserName] = useState("");
  const [assignmentsDueTomorrow, setAssignmentsDueTomorrow] = useState(0);
  const [currentWeek, setCurrentWeek] = useState(0);

  const totalWeeks = 15;
  const navigate = useNavigate(); // 👈 ADD THIS

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const docRef = doc(db, "users", user.uid);
      const snap = await getDoc(docRef);

      if (!snap.exists()) {
        console.warn("⚠️ No user data found.");
        return;
      }

      const { token, domain, semesterStart: semesterStartStr } = snap.data();

      if (!token || !domain) {
        console.warn("⚠️ Missing token or domain.");
        return;
      }

      // 👤 Fetch name
      try {
        const response = await fetch(
          `/api/canvas-profile?token=${token}&domain=${domain}`
        );
        const profile = await response.json();

        if (profile?.short_name) {
          const firstName = profile.name.split(" ")[0];
          setUserName(firstName);
        } else if (profile?.name) {
          const firstName = profile.name.split(" ")[0];
          setUserName(firstName);
        } else {
          console.warn("No name found in profile response.");
        }
      } catch (err) {
        console.error("❌ Failed to fetch Canvas profile:", err);
      }

      // 📋 Fetch assignments due tomorrow
      try {
        const events = await fetchUpcomingEvents(token, domain);
        const today = new Date();
        let dueTomorrow = 0;

        events.forEach((event: any) => {
          const dateStr = event.due_at || event.start_at;
          if (!dateStr) return;

          const eventDate = new Date(dateStr);
          const diff = Math.ceil(
            (eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (diff === 1) {
            dueTomorrow++;
          }
        });

        setAssignmentsDueTomorrow(dueTomorrow);
      } catch (err) {
        console.error("❌ Failed to fetch Canvas assignments:", err);
      }

      // 📅 Calculate current week
      if (semesterStartStr) {
        const parsedStart = new Date(semesterStartStr);
        if (!isNaN(parsedStart.getTime())) {
          const now = new Date();
          const week =
            Math.floor(
              (now.getTime() - parsedStart.getTime()) /
                (1000 * 60 * 60 * 24 * 7)
            ) + 1;
          setCurrentWeek(week > 0 ? week : 0);
        }
      }
    };

    fetchData();
  }, []);

  const formattedDate = new Date().toLocaleDateString();

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "start",
        paddingBottom: "0.5rem",
      }}
    >
      <div>
        <h2
          style={{
            fontSize: "42px",
            marginBottom: "0.25rem",
            color: "#21003b",
          }}
        >
          Welcome back, {userName || "Student"}!
        </h2>
        <p style={{ margin: 0, fontSize: "24px", color: "#21003b" }}>
          You have <strong>{assignmentsDueTomorrow}</strong> assignment
          {assignmentsDueTomorrow !== 1 && "s"} due tomorrow
          <span
            onClick={() => navigate("/assignments")} // 👈 CLICK GOES TO ASSIGNMENTS
            style={{
              marginLeft: "0.25rem",
              fontWeight: "bold",
              cursor: "pointer",
              textDecoration: "none",
            }}
          >
            {" "}
            view ➜
          </span>
        </p>
      </div>
      <div style={{ textAlign: "right", color: "#21003b"}}>
        <p style={{ margin: 0 }}>{formattedDate}</p>
        <p style={{ margin: 0 }}>
          <strong>
            week {currentWeek}/{totalWeeks}
          </strong>
        </p>
      </div>
    </div>
  );
}

export default DashboardHeader;
