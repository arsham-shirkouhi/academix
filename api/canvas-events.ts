export default async function handler(req: Request) {
    try {
      const { token, domain } = await req.json();
  
      if (!token || !domain) {
        console.error("Missing token or domain");
        return new Response(
          JSON.stringify({ error: "Missing token or domain" }),
          { status: 400 }
        );
      }
  
      const response = await fetch(`${domain}/api/v1/users/self/upcoming_events`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!response.ok) {
        const text = await response.text();
        console.error("Canvas API returned non-200:", text);
        return new Response(JSON.stringify({ error: text }), {
          status: response.status,
        });
      }
  
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      console.error("Server error:", error.message);
      return new Response(
        JSON.stringify({ error: "Server error while contacting Canvas." }),
        { status: 500 }
      );
    }
  }
  