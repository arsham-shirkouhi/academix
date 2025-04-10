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
  const res = await fetch("/api/calendar-events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, domain }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to fetch calendar events");
  }

  return res.json();
}

export const fetchUserProfile = async (token: string, domain: string) => {
  const res = await fetch(`/api/canvas-profile?token=${token}&domain=${domain}`);

  if (!res.ok) {
    throw new Error("Failed to fetch profile");
  }

  return res.json();
};

