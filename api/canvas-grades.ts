export const config = {
  runtime: "edge",
};

export default async function handler(req: Request) {
  try {
    const { token, domain } = await req.json();

    if (!token || !domain) {
      return new Response(
        JSON.stringify({ error: "Missing token or domain" }),
        { status: 400 }
      );
    }

    // Clean domain (remove protocol if present)
    const cleanDomain = domain.replace(/^https?:\/\//, "");

    // First, fetch all courses with enrollments to get current scores
    const coursesRes = await fetch(
      `https://${cleanDomain}/api/v1/courses?include[]=total_scores&enrollment_state=active`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!coursesRes.ok) {
      return new Response(
        JSON.stringify({
          error: "Failed to fetch courses",
          details: await coursesRes.text()
        }),
        { status: coursesRes.status }
      );
    }

    const courses = await coursesRes.json();

    // Filter active courses and transform data
    const activeCourses = courses
      .filter((course: any) => !course.access_restricted)
      .map((course: any) => {
        const enrollment = course.enrollments?.[0];
        return {
          id: course.id.toString(),
          name: course.name,
          current_score: enrollment?.computed_current_score ?? null,
          final_score: enrollment?.computed_final_score ?? null,
          assignments: [] // We'll fetch these next
        };
      });

    // For each course, fetch its assignments
    const coursesWithDetails = await Promise.all(
      activeCourses.map(async (course: any) => {
        try {
          const assignmentsRes = await fetch(
            `https://${cleanDomain}/api/v1/courses/${course.id}/assignments?include[]=submission`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!assignmentsRes.ok) {
            console.error(`Failed to fetch assignments for course ${course.id}`);
            return course; // Return course without assignments rather than null
          }

          const assignments = await assignmentsRes.json();

          // Transform assignments data
          const validAssignments = assignments
            .filter((a: any) => a !== null && a.published)
            .map((assignment: any) => ({
              id: assignment.id.toString(),
              name: assignment.name,
              points_possible: assignment.points_possible,
              score: assignment.submission?.score ?? null,
              due_at: assignment.due_at
            }))
            .sort((a: any, b: any) => {
              if (!a.due_at) return 1;
              if (!b.due_at) return -1;
              return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
            });

          return {
            ...course,
            assignments: validAssignments
          };
        } catch (error) {
          console.error(`Failed to process course ${course.id}:`, error);
          return course; // Return course without assignments rather than null
        }
      })
    );

    return new Response(JSON.stringify(coursesWithDetails), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Server error while contacting Canvas:", error);
    return new Response(
      JSON.stringify({
        error: "Server error while contacting Canvas",
        details: error.message
      }),
      { status: 500 }
    );
  }
}
