// utils/canvasApi.ts

export async function fetchUpcomingEvents(token: string, domain: string) {
  const res = await fetch("/api/canvas-events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, domain }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to fetch upcoming events");
  }

  return res.json();
}

export async function fetchCalendarEvents(token: string, domain: string) {
  const res = await fetch("/api/calendar-events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, domain }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to fetch calendar events");
  }

  return res.json();
}

export const fetchUserProfile = async (token: string, domain: string) => {
  const res = await fetch(`/api/canvas-profile?token=${token}&domain=${domain}`);

  if (!res.ok) {
    throw new Error("Failed to fetch profile");
  }

  return res.json();
};

interface Assignment {
  id: string;
  name: string;
  points_possible: number;
  score: number | null;
  due_at: string | null;
}

interface Course {
  id: string;
  name: string;
  current_score: number | null;
  final_score: number | null;
  assignments: Assignment[];
}

export const calculateGradePercentage = (earned: number, total: number): number => {
  if (total === 0) return 0;
  return (earned / total) * 100;
};

export const getLetterGrade = (percentage: number): string => {
  if (percentage >= 93) return 'A';
  if (percentage >= 90) return 'A-';
  if (percentage >= 87) return 'B+';
  if (percentage >= 83) return 'B';
  if (percentage >= 80) return 'B-';
  if (percentage >= 77) return 'C+';
  if (percentage >= 73) return 'C';
  if (percentage >= 70) return 'C-';
  if (percentage >= 67) return 'D+';
  if (percentage >= 63) return 'D';
  if (percentage >= 60) return 'D-';
  return 'F';
};

export const getGradeColor = (percentage: number): string => {
  if (percentage >= 90) return '#4CAF50'; // Green
  if (percentage >= 80) return '#8BC34A'; // Light Green
  if (percentage >= 70) return '#FFC107'; // Yellow
  if (percentage >= 60) return '#FF9800'; // Orange
  return '#F44336'; // Red
};

export const fetchCourseGrades = async (token: string, domain: string): Promise<Course[]> => {
  const res = await fetch("/api/canvas-grades", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, domain }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to fetch grades");
  }

  const data = await res.json();
  return data;
};

export type { Course, Assignment };
