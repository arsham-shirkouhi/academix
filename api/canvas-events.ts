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
  
      const url = `${domain}/api/v1/users/self/upcoming_events`;
      console.log("📡 Fetching from:", url);
  
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      const contentType = response.headers.get("content-type");
      const responseText = await response.text();
  
      console.log("🔁 Response from Canvas:", responseText);
  
      if (!response.ok) {
        return new Response(JSON.stringify({ error: responseText }), {
          status: response.status,
        });
      }
  
      if (!contentType?.includes("application/json")) {
        console.error("❌ Canvas returned non-JSON response");
        return new Response(
          JSON.stringify({ error: "Non-JSON response from Canvas" }),
          { status: 500 }
        );
      }
  
      const data = JSON.parse(responseText);
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      console.error("❌ Server error:", error.message);
      return new Response(
        JSON.stringify({ error: "Server error while contacting Canvas." }),
        { status: 500 }
      );
    }
  }
  