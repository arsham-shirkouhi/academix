const SCHEDULE_KEY = "userWeeklySchedule";

export const saveSchedule = (schedule: any[]) => {
  localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule));
};

export const loadSchedule = (): any[] => {
  const stored = localStorage.getItem(SCHEDULE_KEY);
  return stored ? JSON.parse(stored) : [];
};
