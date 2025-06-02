import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface Course {
    name: string;
    assignments: Assignment[];
    finalGrade?: number;
}

interface Assignment {
    name: string;
    grade: number;
    weight: number;
    category: string;
}

function Grades() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGrades = async () => {
            const user = auth.currentUser;
            if (!user) return;

            try {
                const gradesRef = doc(db, "users", user.uid, "academic", "grades");
                const gradesDoc = await getDoc(gradesRef);

                if (gradesDoc.exists()) {
                    setCourses(gradesDoc.data().courses || []);
                } else {
                    // Initialize with empty courses if no data exists
                    await setDoc(gradesRef, { courses: [] });
                    setCourses([]);
                }
            } catch (error) {
                console.error("Error fetching grades:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchGrades();
    }, []);

    const calculateFinalGrade = (assignments: Assignment[]) => {
        if (assignments.length === 0) return null;

        const totalWeight = assignments.reduce((sum, assignment) => sum + assignment.weight, 0);
        const weightedSum = assignments.reduce(
            (sum, assignment) => sum + (assignment.grade * assignment.weight),
            0
        );

        return totalWeight > 0 ? (weightedSum / totalWeight).toFixed(2) : null;
    };

    const getGradeColor = (grade: number) => {
        if (grade >= 90) return "#4CAF50";
        if (grade >= 80) return "#8BC34A";
        if (grade >= 70) return "#FFC107";
        if (grade >= 60) return "#FF9800";
        return "#F44336";
    };

    if (loading) {
        return (
            <div style={{ padding: "2rem" }}>
                <h2>Loading grades...</h2>
            </div>
        );
    }

    return (
        <div style={{ padding: "2rem" }}>
            <h2 style={{
                fontSize: "32px",
                marginBottom: "1.5rem",
                color: "#1F0741"
            }}>
                Grades
            </h2>

            {courses.length === 0 ? (
                <div style={{
                    textAlign: "center",
                    padding: "3rem",
                    backgroundColor: "#FFFBF1",
                    borderRadius: "16px",
                    border: "3px solid #1F0741"
                }}>
                    <h3 style={{
                        color: "#1F0741",
                        marginBottom: "1rem"
                    }}>
                        No courses added yet
                    </h3>
                    <p style={{ color: "#666" }}>
                        Add your first course to start tracking your grades!
                    </p>
                    <button
                        style={{
                            backgroundColor: "#ffb703",
                            border: "3px solid #1F0741",
                            borderRadius: "10px",
                            padding: "0.75rem 1.5rem",
                            fontSize: "16px",
                            fontWeight: "bold",
                            cursor: "pointer",
                            marginTop: "1rem",
                            transition: "all 0.2s ease"
                        }}
                        onClick={() => {
                            // Add course functionality will be implemented here
                            console.log("Add course clicked");
                        }}
                    >
                        Add Course
                    </button>
                </div>
            ) : (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                    gap: "1.5rem"
                }}>
                    {courses.map((course, index) => {
                        const finalGrade = calculateFinalGrade(course.assignments);
                        return (
                            <div
                                key={index}
                                style={{
                                    backgroundColor: "#FFFBF1",
                                    borderRadius: "16px",
                                    border: "3px solid #1F0741",
                                    overflow: "hidden"
                                }}
                            >
                                <div style={{
                                    backgroundColor: "#1F0741",
                                    color: "#FFFBF1",
                                    padding: "1rem",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center"
                                }}>
                                    <h3 style={{ margin: 0 }}>{course.name}</h3>
                                    {finalGrade && (
                                        <span style={{
                                            backgroundColor: getGradeColor(parseFloat(finalGrade)),
                                            padding: "0.25rem 0.75rem",
                                            borderRadius: "20px",
                                            fontWeight: "bold"
                                        }}>
                                            {finalGrade}%
                                        </span>
                                    )}
                                </div>

                                <div style={{ padding: "1rem" }}>
                                    {course.assignments.length === 0 ? (
                                        <p style={{ textAlign: "center", color: "#666" }}>
                                            No assignments added yet
                                        </p>
                                    ) : (
                                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                            <thead>
                                                <tr style={{ borderBottom: "2px solid #1F0741" }}>
                                                    <th style={{ textAlign: "left", padding: "0.5rem" }}>Assignment</th>
                                                    <th style={{ textAlign: "right", padding: "0.5rem" }}>Grade</th>
                                                    <th style={{ textAlign: "right", padding: "0.5rem" }}>Weight</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {course.assignments.map((assignment, idx) => (
                                                    <tr
                                                        key={idx}
                                                        style={{
                                                            borderBottom: "1px solid #ddd"
                                                        }}
                                                    >
                                                        <td style={{ padding: "0.5rem" }}>{assignment.name}</td>
                                                        <td style={{
                                                            padding: "0.5rem",
                                                            textAlign: "right",
                                                            color: getGradeColor(assignment.grade)
                                                        }}>
                                                            {assignment.grade}%
                                                        </td>
                                                        <td style={{ padding: "0.5rem", textAlign: "right" }}>
                                                            {assignment.weight}%
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}

                                    <button
                                        style={{
                                            width: "100%",
                                            backgroundColor: "#ffb703",
                                            border: "2px solid #1F0741",
                                            borderRadius: "8px",
                                            padding: "0.5rem",
                                            marginTop: "1rem",
                                            fontSize: "14px",
                                            fontWeight: "bold",
                                            cursor: "pointer"
                                        }}
                                        onClick={() => {
                                            // Add assignment functionality will be implemented here
                                            console.log("Add assignment clicked for course:", course.name);
                                        }}
                                    >
                                        Add Assignment
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default Grades; 