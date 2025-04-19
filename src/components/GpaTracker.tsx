import { useEffect, useState } from "react";
import { getUserSettings } from "../utils/firestoreUser";
import { auth } from "../firebase";

interface GradeEntry {
  course: string;
  score: number;
}

function GpaTracker() {
  const [grades, setGrades] = useState<GradeEntry[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const fetchGrades = async () => {
      const user = auth.currentUser;
      if (!user) {
        console.warn("🚫 No authenticated user.");
        return;
      }

      try {
        const settings = await getUserSettings(user.uid);
        const token = settings?.token;
        const domain = settings?.domain;

        if (!token || !domain) {
          console.error("❌ Canvas token or domain missing from Firestore.");
          return;
        }

        const cleanDomain = domain.replace(/^https?:\/\//, "");
        const res = await fetch(`/api/canvas-grades?token=${token}&domain=${cleanDomain}`);

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`API error: ${errorText}`);
        }

        const data: GradeEntry[] = await res.json();

        const uniqueCourses = new Map<string, GradeEntry>();
        for (const entry of data) {
          if (!uniqueCourses.has(entry.course) || uniqueCourses.get(entry.course)!.score < entry.score) {
            uniqueCourses.set(entry.course, entry);
          }
        }

        const deduplicated = Array.from(uniqueCourses.values());
        setGrades(deduplicated);
      } catch (err) {
        console.error("🔥 Error fetching grades:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, []);

  const projectedGpa = grades.length
    ? (
        grades.map((g) => percentageToGpa(g.score)).reduce((a, b) => a + b, 0) /
        grades.length
      ).toFixed(2)
    : null;

  return (
    <div style={{ backgroundColor: "#f0f0f0", padding: "1rem", borderRadius: "8px" }}>
      <h3 style={{ color: "#1F0741" }}>📘 Grade Overview</h3>

      {loading ? (
        <p>Loading grades...</p>
      ) : grades.length === 0 ? (
        <p>No grades found.</p>
      ) : (
        <>
          <ul style={{ listStyle: "none", padding: 0, marginTop: "1rem" }}>
            {grades.map((g, i) => (
              <li key={i} style={{ marginBottom: "6px", fontSize: "1rem" }}>
                <strong>{g.course}</strong>: {g.score.toFixed(1)}%
              </li>
            ))}
          </ul>
          <hr style={{ margin: "1rem 0", border: "1px solid #ccc" }} />
          <p style={{ fontWeight: "bold", fontSize: "1.1rem", color: "#1F0741" }}>
            🎓 Projected GPA: <span style={{ fontWeight: "900" }}>{projectedGpa}</span>
          </p>
        </>
      )}
    </div>
  );
}

export default GpaTracker;
