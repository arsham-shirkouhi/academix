import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { fetchUpcomingEvents, fetchUserProfile } from "../utils/canvasApi";
import { useNavigate } from "react-router-dom";

function DashboardHeader() {
  const [assignmentsDueTomorrow, setAssignmentsDueTomorrow] = useState(0);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [userName, setUserName] = useState("");
  const [loadingText, setLoadingText] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const totalWeeks = 15;
  const navigate = useNavigate();

  // Function to get a random letter
  const getRandomLetter = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return letters.charAt(Math.floor(Math.random() * letters.length));
  };

  // Loading animation effect
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isLoading) {
      intervalId = setInterval(() => {
        const shuffledText = Array(10)
          .fill('')
          .map(() => getRandomLetter())
          .join('');
        setLoadingText(shuffledText);
      }, 50); // Faster interval for more dynamic effect
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLoading]);

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

      // Fetch user name from Canvas
      try {
        const profile = await fetchUserProfile(token, domain);
        if (profile.name) {
          // Extract just the first name
          const firstName = profile.name.split(' ')[0];
          setUserName(firstName);
        }
      } catch (err) {
        console.error("❌ Failed to fetch user profile:", err);
      }
      setIsLoading(false);

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
            marginBottom: "0.15rem",
            color: "#21003b",
          }}
        >
          Welcome back, {isLoading ? loadingText : userName || "Student"}!
        </h2>
        <p style={{ margin: 0, fontSize: "24px", color: "#21003b" }}>
          {assignmentsDueTomorrow === 0 ? (
            "Yay! Take a breather, you don't have anything due!"
          ) : (
            <>
              You have <strong>{assignmentsDueTomorrow}</strong> assignment
              {assignmentsDueTomorrow !== 1 && "s"} due tomorrow
              <span
                onClick={() => navigate("/assignments")}
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
            </>
          )}
        </p>
      </div>
      <div style={{ textAlign: "right", color: "#21003b" }}>
        <p style={{ margin: 0 }}>
          <strong>week {currentWeek}/{totalWeeks}</strong> | {formattedDate}
        </p>
      </div>
    </div>
  );
}

export default DashboardHeader;
