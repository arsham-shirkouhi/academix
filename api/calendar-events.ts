export const config = {
    runtime: "edge",
  };
  
  export default async function handler(req: Request) {
    try {
      const { token, domain } = await req.json();
  
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 7);
  
      const res = await fetch(
        `${domain}/api/v1/calendar_events?type=event&start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      const text = await res.text();
  
      if (!res.ok) {
        return new Response(JSON.stringify({ error: text }), {
          status: res.status,
          headers: { "Content-Type": "application/json" },
        });
      }
  
      return new Response(text, {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(
        JSON.stringify({ error: "Server error while contacting Canvas." }),
        { status: 500 }
      );
    }
  }
  