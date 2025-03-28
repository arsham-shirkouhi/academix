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
  
      const canvasUrl = `${domain}/api/v1/users/self/upcoming_events`;
      console.log("📡 Requesting:", canvasUrl);
  
      const response = await fetch(canvasUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      const text = await response.text();
  
      if (!response.ok) {
        console.error("Canvas returned error:", text);
        return new Response(JSON.stringify({ error: text }), {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        });
      }
  
      return new Response(text, {
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
  