// import { useEffect, useState } from "react";
// import { getUserSettings } from "../utils/firestoreUser";
// import { auth } from "../firebase";

// interface GradeEntry {
//   course: string;
//   score: number;
// }

// function GpaTracker() {
//   const [grades, setGrades] = useState<GradeEntry[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchGrades = async () => {
//       const user = auth.currentUser;
//       if (!user) {
//         console.warn("🚫 No authenticated user.");
//         return;
//       }

//       try {
//         const settings = await getUserSettings(user.uid);
//         const token = settings?.token;
//         const domain = settings?.domain;

//         if (!token || !domain) {
//           console.error("❌ Canvas token or domain missing from Firestore.");
//           return;
//         }

//         console.log("🌐 Fetching grades from API with domain:", domain);

//         const res = await fetch(`/api/canvas-grades?token=${token}&domain=${domain}`);
//         if (!res.ok) {
//           const errorText = await res.text();
//           throw new Error(`API error: ${errorText}`);
//         }

//         const data = await res.json();
//         console.log("✅ Grades fetched:", data);

//         setGrades(data);
//       } catch (err) {
//         console.error("🔥 Error fetching grades:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchGrades();
//   }, []);

//   return (
//     <div style={{ backgroundColor: "#f0f0f0", padding: "1rem", borderRadius: "8px" }}>
//       <h3 style={{ color: "#1F0741" }}>📘 Grade Overview</h3>

//       {loading ? (
//         <p>Loading grades...</p>
//       ) : grades.length === 0 ? (
//         <p>No grades found.</p>
//       ) : (
//         <ul style={{ listStyle: "none", padding: 0, marginTop: "1rem" }}>
//           {grades.map((g, i) => (
//             <li key={i} style={{ marginBottom: "6px", fontSize: "1rem" }}>
//               <strong>{g.course}</strong>: {g.score.toFixed(1)}%
//             </li>
//           ))}
//         </ul>
//       )}
//     </div>
//   );
// }

// export default GpaTracker;
