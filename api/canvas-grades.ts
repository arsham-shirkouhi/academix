export const config = {
    runtime: "edge",
  };
  
  export default async function handler(req: Request) {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    let domain = searchParams.get("domain");
  
    if (!token || !domain) {
      return new Response("Missing token or domain", {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  
    // Normalize domain (strip https:// if included)
    domain = domain.replace(/^https?:\/\//, "");
  
    try {
      const enrollmentsRes = await fetch(`https://${domain}/api/v1/users/self/enrollments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!enrollmentsRes.ok) {
        const error = await enrollmentsRes.text();
        return new Response(`Canvas API error: ${error}`, {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
  
      const enrollments = await enrollmentsRes.json();
  
      const grades = await Promise.all(
        enrollments
          .filter((e: any) => e.grades?.current_score !== null && e.course_id)
          .map(async (e: any) => {
            let courseName = `Course ID: ${e.course_id}`;
            try {
              const courseRes = await fetch(`https://${domain}/api/v1/courses/${e.course_id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
  
              if (courseRes.ok) {
                const courseData = await courseRes.json();
                const nameParts = courseData.name?.split(" - ");
                courseName = nameParts.length > 1 ? nameParts.slice(1).join(" - ").trim() : courseData.name;
              }
            } catch (err) {
              console.warn(`⚠️ Could not fetch course name for ID ${e.course_id}`);
            }
  
            return {
              course: courseName,
              score: e.grades.current_score,
            };
          })
      );
  
      return new Response(JSON.stringify(grades), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response("Failed to fetch Canvas grades", {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
  