export default async function handler(req: any, res: any) {
    const { token, domain } = req.query;
  
    const response = await fetch(`${domain}/api/v1/users/self/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  
    const data = await response.json();
  
    if (!response.ok) {
      return res.status(response.status).json({ error: "Failed to fetch profile" });
    }
  
    return res.status(200).json(data);
  }
  