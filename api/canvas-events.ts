export default async function handler(req: Request) {
    const { token, domain } = await req.json();
  
    if (!token || !domain) {
      return new Response(
        JSON.stringify({ error: "Missing token or domain" }),
        { status: 400 }
      );
    }
  
    try {
      const response = await fetch(`${domain}/api/v1/users/self/upcoming_events`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!response.ok) {
        const text = await response.text();
        return new Response(JSON.stringify({ error: text }), { status: response.status });
      }
  
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Server error while contacting Canvas." }),
        { status: 500 }
      );
    }
  }
  