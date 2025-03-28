export async function fetchUpcomingEvents(token: string, domain: string) {
  const res = await fetch("/api/canvas-events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, domain }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to fetch upcoming events");
  }

  return res.json();
}
