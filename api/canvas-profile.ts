export const config = {
  runtime: "edge",
};

export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url);

  const token = searchParams.get("token");
  const domain = searchParams.get("domain");

  if (!token || !domain) {
    return new Response(
      JSON.stringify({ error: "Missing token or domain" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
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
      return new Response(
        JSON.stringify({ error: "Failed to fetch profile", details: data }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("Server error:", err.message);
    return new Response(
      JSON.stringify({ error: "Unexpected error", details: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
