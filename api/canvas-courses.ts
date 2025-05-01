// /api/canvas-courses.ts
export const config = {
    runtime: "edge",
  };
  
  export default async function handler(req: Request) {
    try {
      const { token, domain } = await req.json();
  
      if (!token || !domain) {
        return new Response(JSON.stringify({ error: "Missing token or domain" }), { status: 400 });
      }
  
      const canvasUrl = `${domain}/api/v1/courses`;
      const response = await fetch(canvasUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      const data = await response.text();
  
      if (!response.ok) {
        return new Response(JSON.stringify({ error: data }), {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        });
      }
  
      return new Response(data, {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
  