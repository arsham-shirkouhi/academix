import { useEffect, useState } from "react";
import { getUserSettings } from "../utils/firestoreUser";
import { auth } from "../firebase";
import { getLetterGrade, getGradeColor } from "../utils/canvasApi";

interface GradeEntry {
    course: string;
    autoScore: number;
    hidden?: boolean;
    excludeFromGPA?: boolean;
    isExpanded?: boolean;
}

function GradeOverview() {
    const [grades, setGrades] = useState<GradeEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [projectedGpa, setProjectedGpa] = useState<string | null>(null);

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

    const calculateProjectedGpa = (gradesList: GradeEntry[]) => {
        const visibleGrades = gradesList.filter(g => !g.excludeFromGPA);
        if (visibleGrades.length === 0) {
            setProjectedGpa(null);
            return;
        }
        const gpa = (
            visibleGrades
                .map(g => percentageToGpa(g.autoScore))
                .reduce((a, b) => a + b, 0) / visibleGrades.length
        ).toFixed(2);
        setProjectedGpa(gpa);
    };

    const toggleGradeExclusion = (index: number) => {
        setGrades(prev => {
            const newGrades = prev.map((grade, i) =>
                i === index ? { ...grade, excludeFromGPA: !grade.excludeFromGPA } : grade
            );
            calculateProjectedGpa(newGrades);
            return newGrades;
        });
    };

    useEffect(() => {
        const fetchGrades = async () => {
            setLoading(true);
            const user = auth.currentUser;
            if (!user) {
                setError("Please sign in to view grades");
                setLoading(false);
                return;
            }

            try {
                const settings = await getUserSettings(user.uid);
                const token = settings?.token;
                const domain = settings?.domain;

                if (!token || !domain) {
                    setError("Please configure your Canvas settings");
                    setLoading(false);
                    return;
                }

                const cleanDomain = domain.replace(/^https?:\/\//, "");
                const res = await fetch("/api/canvas-grades", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token, domain: cleanDomain }),
                });

                if (!res.ok) throw new Error(await res.text());

                const coursesData = await res.json();
                const gradeEntries: GradeEntry[] = coursesData
                    .filter((course: any) => course.current_score !== null)
                    .map((course: any) => ({
                        course: course.name,
                        autoScore: course.current_score,
                        excludeFromGPA: false,
                        isExpanded: false
                    }));

                setGrades(gradeEntries);
                calculateProjectedGpa(gradeEntries);
            } catch (err) {
                console.error("Error fetching grades:", err);
                setError("Failed to load grades. Please try again later.");
            } finally {
                setTimeout(() => {
                    setLoading(false);
                }, 1000);
            }
        };

        fetchGrades();
    }, []);

    return (
        <div style={{}}>

            <style>
                {`
                    @keyframes slideInFromLeft {
                        0% { 
                            opacity: 0;
                            transform: translateX(-20px);
                        }
                        100% { 
                            opacity: 1;
                            transform: translateX(0);
                        }
                    }
                    @keyframes shimmer {
                        0% { background-position: -200% 0; }
                        100% { background-position: 200% 0; }
                    }
                    .skeleton {
                        background: linear-gradient(
                            90deg,
                            #f0f0f0 25%,
                            #e0e0e0 37%,
                            #f0f0f0 63%
                        );
                        background-size: 200% 100%;
                        animation: shimmer 2.5s infinite ease-in-out;
                        border-radius: 4px;
                    }
                    .skeleton-dark {
                        background: linear-gradient(
                            90deg,
                            rgba(255, 255, 255, 0.05) 25%,
                            rgba(255, 255, 255, 0.15) 37%,
                            rgba(255, 255, 255, 0.05) 63%
                        );
                        background-size: 200% 100%;
                        animation: shimmer 2.5s infinite ease-in-out;
                        border-radius: 4px;
                    }
                    .action-button {
                        width: 32px;
                        height: 32px;
                        border: 2px solid #1F0741;
                        border-radius: 6px;
                        background: #FFFBF1;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.2s ease;
                        opacity: 0;
                        transform: scale(0.9);
                    }
                    .action-button:hover {
                        background: #1F0741;
                        color: #FFFBF1;
                        transform: scale(1.1);
                    }
                    .action-button.excluded {
                        background: #1F0741;
                        color: #FFFBF1;
                    }
                    .grade-card:hover .action-button {
                        opacity: 1;
                        transform: scale(1);
                    }
                    .buttons-container {
                        position: absolute;
                        right: 15px;
                        top: 15px;
                        display: flex;
                        gap: 0.5rem;
                        z-index: 2;
                    }
                    .excluded-text {
                        opacity: 0.6;
                        filter: grayscale(30%);
                        transition: all 0.2s ease;
                    }
                `}
            </style>

            {loading ? (
                <div style={{
                    border: "3px solid #1F0741",
                    borderRadius: "16px",
                    overflow: "hidden",
                    backgroundColor: "#FFFBF1",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column"
                }}>
                    {/* Header Skeleton */}
                    <div style={{
                        backgroundColor: "#1F0741",
                        color: "#FFFBF1",
                        padding: "0.75rem 1rem",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <div className="skeleton-dark" style={{
                                width: "200px",
                                height: "28px"
                            }} />
                        </div>
                        <div className="skeleton-dark" style={{
                            width: "120px",
                            height: "20px"
                        }} />
                    </div>

                    {/* Grade Cards Skeleton */}
                    <div style={{
                        padding: "15px",
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
                        gap: "10px",
                        flex: 1,
                        overflowY: "auto"
                    }}>
                        {[1, 2, 3, 4].map((_, index) => (
                            <div
                                key={index}
                                style={{
                                    border: "3px solid #e0e0e0",
                                    borderRadius: "10px",
                                    padding: "1rem 1rem 1rem calc(8px + 1rem)",
                                    background: "#FFFBF1",
                                    position: "relative",
                                    animation: `slideInFromLeft 0.5s ease forwards ${index * 0.15}s`,
                                    opacity: 0
                                }}
                            >
                                {/* Left color indicator */}
                                <div className="skeleton" style={{
                                    position: "absolute",
                                    left: "0",
                                    top: "0",
                                    bottom: "0",
                                    width: "8px",
                                    borderTopLeftRadius: "8px",
                                    borderBottomLeftRadius: "8px"
                                }} />

                                {/* Course name and type */}
                                <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                    marginBottom: "1rem"
                                }}>
                                    <div>
                                        <div className="skeleton" style={{
                                            width: "200px",
                                            height: "28px",
                                            marginBottom: "0.25rem"
                                        }} />
                                        <div className="skeleton" style={{
                                            width: "100px",
                                            height: "16px"
                                        }} />
                                    </div>
                                </div>

                                {/* Current grade text */}
                                <div className="skeleton" style={{
                                    marginBottom: "0.5rem",
                                    height: "20px",
                                    width: "120px"
                                }} />

                                {/* Progress bar */}
                                <div style={{
                                    width: "100%",
                                    height: "16px",
                                    backgroundColor: "#f0f0f0",
                                    borderRadius: "4px",
                                    overflow: "hidden",
                                    position: "relative"
                                }}>
                                    <div className="skeleton" style={{
                                        width: "100%",
                                        height: "100%",
                                        borderRadius: "4px"
                                    }} />
                                </div>

                                {/* Grade percentage and letter */}
                                <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginTop: "0.5rem"
                                }}>
                                    <div className="skeleton" style={{
                                        width: "50px",
                                        height: "20px"
                                    }} />
                                    <div className="skeleton" style={{
                                        width: "30px",
                                        height: "20px"
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : error ? (
                <div style={{ padding: "2rem", color: "#F44336" }}>
                    <p>{error}</p>
                </div>
            ) : (
                <>
                    <div style={{
                        border: "3px solid #1F0741",
                        borderRadius: "16px",
                        overflow: "hidden",
                        backgroundColor: "#FFFBF1",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column"
                    }}>
                        <div style={{
                            backgroundColor: "#1F0741",
                            color: "#FFFBF1",
                            padding: "0.75rem 1rem",
                            fontSize: "24px",
                            fontWeight: "bold",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                Estimated GPA: <span style={{ color: "#FFB800" }}>{projectedGpa || "N/A"}</span>
                            </div>
                            <div style={{ fontSize: "16px", opacity: 0.8 }}>
                                {grades.filter(g => !g.excludeFromGPA).length}/{grades.length} courses included
                            </div>
                        </div>

                        <div style={{
                            padding: "15px",
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
                            gap: "10px",
                            flex: 1,
                            overflowY: "auto"
                        }}>
                            {grades.map((grade, index) => {
                                const letterGrade = getLetterGrade(grade.autoScore);
                                const courseName = (() => {
                                    const fullName = grade.course;
                                    const parts = fullName.split(" - ");
                                    return parts.length > 1 ? parts.slice(1).join(" - ").trim() : fullName;
                                })();
                                const gradeColor = getGradeColor(grade.autoScore);

                                return (
                                    <div
                                        key={index}
                                        className="grade-card"
                                        style={{
                                            border: "3px solid #1F0741",
                                            borderRadius: "10px",
                                            padding: "1rem 1rem 1rem calc(8px + 1rem)",
                                            background: "#FFFBF1",
                                            position: "relative",
                                            animation: `slideInFromLeft 0.5s ease forwards ${index * 0.15}s`,
                                            cursor: "default",
                                            opacity: 0
                                        }}
                                    >
                                        <div className="buttons-container">
                                            <button
                                                className="action-button"
                                                onClick={() => {/* TODO: Add edit functionality */ }}
                                                title="Edit grade"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className={`action-button ${grade.excludeFromGPA ? 'excluded' : ''}`}
                                                onClick={() => toggleGradeExclusion(index)}
                                                title={grade.excludeFromGPA ? "Include in GPA" : "Exclude from GPA"}
                                            >
                                                📊
                                            </button>
                                        </div>

                                        <div style={{
                                            position: "absolute",
                                            left: "0",
                                            top: "0",
                                            bottom: "0",
                                            width: "8px",
                                            backgroundColor: gradeColor,
                                            borderTopLeftRadius: "8px",
                                            borderBottomLeftRadius: "8px",
                                            opacity: grade.excludeFromGPA ? 0.4 : 1,
                                            transition: "opacity 0.2s ease"
                                        }} />

                                        <div style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "flex-start",
                                            marginBottom: "1rem",
                                            ...(grade.excludeFromGPA && { opacity: 0.6, filter: "grayscale(30%)" })
                                        }}>
                                            <div>
                                                <div style={{
                                                    fontSize: "1.5rem",
                                                    fontWeight: "bold",
                                                    color: "#1F0741",
                                                    marginBottom: "0.25rem"
                                                }}>
                                                    {courseName}
                                                </div>
                                                <div style={{
                                                    fontSize: "0.875rem",
                                                    color: "#666"
                                                }}>
                                                    canvas grade
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{
                                            marginBottom: "0.5rem",
                                            fontSize: "1.125rem",
                                            fontWeight: "500",
                                            color: "#1F0741",
                                            ...(grade.excludeFromGPA && { opacity: 0.6, filter: "grayscale(30%)" })
                                        }}>
                                            current grade
                                        </div>

                                        <div style={{
                                            width: "100%",
                                            height: "16px",
                                            backgroundColor: grade.excludeFromGPA ? "#f5f5f5" : "#f0f0f0",
                                            borderRadius: "4px",
                                            overflow: "hidden",
                                            position: "relative",
                                            transition: "all 0.2s ease",
                                            border: `2px solid ${grade.excludeFromGPA ? '#e0e0e0' : '#1F0741'}`
                                        }}>
                                            <div
                                                style={{
                                                    height: "100%",
                                                    backgroundColor: gradeColor,
                                                    width: `${grade.autoScore}%`,
                                                    opacity: grade.excludeFromGPA ? 0.4 : 1,
                                                    transition: "all 0.2s ease"
                                                }}
                                            />
                                        </div>

                                        <div style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            marginTop: "0.5rem",
                                            ...(grade.excludeFromGPA && { opacity: 0.6, filter: "grayscale(30%)" })
                                        }}>
                                            <div style={{
                                                fontSize: "1rem",
                                                fontWeight: "500",
                                                color: "#1F0741"
                                            }}>
                                                {grade.autoScore.toFixed(1)}%
                                            </div>
                                            <div style={{
                                                fontSize: "1rem",
                                                fontWeight: "500",
                                                color: "#1F0741"
                                            }}>
                                                {letterGrade}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default GradeOverview; 