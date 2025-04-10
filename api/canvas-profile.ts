// /api/canvas-profile.ts

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { token, domain } = req.body;

  if (!token || !domain) {
    return res.status(400).json({ error: "Missing token or domain" });
  }

  try {
    const response = await fetch(`${domain}/api/v1/users/self/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Canvas error:", data);
      return res.status(response.status).json({ error: "Failed to fetch profile", details: data });
    }

    return res.status(200).json(data);
  } catch (err: any) {
    console.error("Server error:", err.message);
    return res.status(500).json({ error: "Unexpected error", details: err.message });
  }
}
