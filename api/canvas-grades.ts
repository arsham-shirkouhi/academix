// pages/api/canvas-grades.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { token, domain } = req.query;

  if (!token || !domain || typeof token !== "string" || typeof domain !== "string") {
    return res.status(400).json({ error: "Missing token or domain" });
  }

  try {
    // Step 1: Get user courses
    const coursesRes = await fetch(`https://${domain}/api/v1/users/self/courses`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const courses = await coursesRes.json();

    const gradeResults: { course: string; score: number }[] = [];

    // Step 2: Loop through courses to get grades
    for (const course of courses) {
      const gradesRes = await fetch(
        `https://${domain}/api/v1/courses/${course.id}/grades`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const gradeData = await gradesRes.json();
      const score = gradeData?.enrollments?.[0]?.grades?.current_score;

      if (score !== undefined && score !== null) {
        gradeResults.push({
          course: course.name,
          score,
        });
      }
    }

    return res.status(200).json(gradeResults);
  } catch (error) {
    console.error("❌ Error fetching Canvas grades:", error);
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
}
