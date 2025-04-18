// export const config = {
//     runtime: "edge",
//   };
  
//   export default async function handler(req: Request) {
//     const { searchParams } = new URL(req.url);
//     const token = searchParams.get("token");
//     const domain = searchParams.get("domain");
  
//     if (!token || !domain) {
//       return new Response("Missing token or domain", {
//         status: 400,
//         headers: {
//           "Content-Type": "application/json",
//           "Access-Control-Allow-Origin": "*",
//         },
//       });
//     }
  
//     try {
//       const enrollmentsRes = await fetch(`https://${domain}/api/v1/users/self/enrollments`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });
  
//       if (!enrollmentsRes.ok) {
//         const error = await enrollmentsRes.text();
//         return new Response(`Canvas API error: ${error}`, {
//           status: 500,
//           headers: {
//             "Content-Type": "application/json",
//             "Access-Control-Allow-Origin": "*",
//           },
//         });
//       }
  
//       const enrollments = await enrollmentsRes.json();
  
//       const grades = enrollments
//         .filter((e: any) => e.grades?.current_score !== null && e.course_id)
//         .map((e: any) => ({
//           course: `Course ID: ${e.course_id}`,
//           score: e.grades.current_score,
//         }));
  
//       return new Response(JSON.stringify(grades), {
//         status: 200,
//         headers: {
//           "Content-Type": "application/json",
//           "Access-Control-Allow-Origin": "*",
//         },
//       });
//     } catch (err) {
//       return new Response("Failed to fetch profile", {
//         status: 500,
//         headers: {
//           "Content-Type": "application/json",
//           "Access-Control-Allow-Origin": "*",
//         },
//       });
//     }
//   }
  