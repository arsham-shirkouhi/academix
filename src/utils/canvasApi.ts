// utils/canvasApi.ts

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

export async function fetchCalendarEvents(token: string, domain: string) {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + 7); // Get events for the next 7 days

  const res = await fetch(
    `${domain}/api/v1/calendar_events?type=event&start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText);
  }

  return res.json();
}
