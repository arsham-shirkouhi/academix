import { useEffect, useState } from "react";
import { getUserSettings } from "../utils/firestoreUser";
import { auth } from "../firebase";

interface GradeEntry {
  course: string;
  score: number;
  hidden?: boolean;
  isEditing?: boolean;
}

function GpaTracker() {
  const [grades, setGrades] = useState<GradeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingValue, setEditingValue] = useState<string>("");

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

  const toggleHideGrade = (index: number) => {
    setGrades(prevGrades =>
      prevGrades.map((grade, i) =>
        i === index ? { ...grade, hidden: !grade.hidden } : grade
      )
    );
  };

  const startEditing = (index: number) => {
    setGrades(prevGrades =>
      prevGrades.map((grade, i) =>
        i === index ? { ...grade, isEditing: true } : { ...grade, isEditing: false }
      )
    );
    setEditingValue(grades[index].score.toFixed(1));
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || (/^\d{1,3}(\.\d{0,1})?$/.test(value) && parseFloat(value) <= 100)) {
      setEditingValue(value);
    }
  };

  const finishEditing = (index: number) => {
    setGrades(prevGrades =>
      prevGrades.map((grade, i) => {
        if (i === index) {
          const newScore = Math.min(100, Math.max(0, parseFloat(editingValue) || 0));
          return { ...grade, score: newScore, isEditing: false };
        }
        return grade;
      })
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Enter") {
      finishEditing(index);
    } else if (e.key === "Escape") {
      setGrades(prevGrades =>
        prevGrades.map((grade, i) =>
          i === index ? { ...grade, isEditing: false } : grade
        )
      );
    }
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
            uniqueCourses.set(entry.course, { ...entry, hidden: false, isEditing: false });
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

  const visibleGrades = grades.filter(g => !g.hidden);
  const projectedGpa = visibleGrades.length
    ? (
      visibleGrades.map((g) => percentageToGpa(g.score)).reduce((a, b) => a + b, 0) /
      visibleGrades.length
    ).toFixed(2)
    : null;

  return (
    <div style={{ backgroundColor: "", padding: "5px" }}>
      {loading ? (
        <p style={{ margin: 0, fontSize: "14px" }}>Loading grades...</p>
      ) : grades.length === 0 ? (
        <p style={{ margin: 0, fontSize: "14px" }}>No grades found.</p>
      ) : (
        <>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {grades.map((g, i) => (
              <li
                key={i}
                style={{
                  marginBottom: i === grades.length - 1 ? "0" : "4px",
                  fontSize: "14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  opacity: g.hidden ? 0.5 : 1,
                  transition: "opacity 0.2s ease"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <strong>{g.course}</strong>:
                  {g.isEditing ? (
                    <input
                      type="text"
                      value={editingValue}
                      onChange={handleEditChange}
                      onBlur={() => finishEditing(i)}
                      onKeyDown={(e) => handleKeyPress(e, i)}
                      style={{
                        width: "60px",
                        padding: "2px 4px",
                        fontSize: "14px",
                        border: "1px solid #1F0741",
                        borderRadius: "4px",
                        backgroundColor: "rgb(255, 251, 241)"
                      }}
                      autoFocus
                    />
                  ) : (
                    <span
                      onClick={() => startEditing(i)}
                      style={{ cursor: "pointer", padding: "2px 4px" }}
                    >
                      {g.score.toFixed(1)}%
                    </span>
                  )}
                </div>
                <button
                  onClick={() => toggleHideGrade(i)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px 8px",
                    fontSize: "12px",
                    color: g.hidden ? "#666" : "#1F0741",
                    transition: "color 0.2s ease"
                  }}
                >
                  {g.hidden ? "Show" : "Hide"}
                </button>
              </li>
            ))}
          </ul>
          <hr style={{ margin: "0.5rem 0", border: "1px solid #1F0741" }} />
          <p style={{
            fontWeight: "bold",
            fontSize: "14px",
            color: "#1F0741",
            margin: 0,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <span>Projected GPA: <span style={{ fontWeight: "900" }}>{projectedGpa}</span></span>
            <span style={{ fontSize: "12px", opacity: 0.7 }}>
              {visibleGrades.length}/{grades.length} courses
            </span>
          </p>
        </>
      )}
    </div>
  );
}

export default GpaTracker;
