import { useEffect, useState } from "react";

function GpaTracker() {
  const [gpa, setGpa] = useState<number | null>(null);

  useEffect(() => {
    const fetchGpa = async () => {
      const token = localStorage.getItem("canvasToken");
      let domain = localStorage.getItem("canvasDomain");
      if (!token || !domain) return;

      domain = domain.replace(/^https?:\/\//, "");

      try {
        const res = await fetch(`/api/canvas-gpa?token=${token}&domain=${domain}`);
        const enrollments = await res.json();

        const scores: number[] = [];

        enrollments.forEach((enroll: any) => {
          const courseName = enroll.course_id;
          const score = enroll.grades?.current_score;

          if (score !== null && score !== undefined) {
            console.log(`${courseName} → ${score}%`);
            scores.push(score);
          }
        });

        const gpa = scores.reduce((acc, s) => acc + percentageToGpa(s), 0) / scores.length;
        setGpa(Number(gpa.toFixed(2)));
      } catch (err) {
        console.error("Failed to fetch GPA:", err);
      }
    };

    fetchGpa();
  }, []);

  const percentageToGpa = (score: number): number => {
    if (score >= 93) return 4.0;
    if (score >= 90) return 3.7;
    if (score >= 87) return 3.3;
    if (score >= 83) return 3.0;
    if (score >= 80) return 2.7;
    if (score >= 77) return 2.3;
    if (score >= 73) return 2.0;
    if (score >= 70) return 1.7;
    if (score >= 67) return 1.3;
    if (score >= 60) return 1.0;
    return 0.0;
  };

  if (gpa === null) return <div>Loading GPA...</div>;

  const percent = (gpa / 4.0) * 100;

  return (
    <div style={{ backgroundColor: "#f0f0f0", padding: "1rem", borderRadius: "8px" }}>
      <h3>Grade & GPA Tracker</h3>
      <div style={{ fontSize: "1.5rem", fontWeight: "bold", marginTop: "0.5rem" }}>
        GPA: {gpa.toFixed(2)} / 4.00
      </div>
      <div style={{ marginTop: "1rem", height: "12px", backgroundColor: "#ddd", borderRadius: "6px" }}>
        <div
          style={{
            height: "100%",
            width: `${percent}%`,
            backgroundColor: "#6BCB77",
            borderRadius: "6px",
          }}
        ></div>
      </div>
      <p style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>
        Keep it up! You're on track for Dean’s List. 🎓
      </p>
    </div>
  );
}

export default GpaTracker;
