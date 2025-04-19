// utils/gradesStorage.ts
export type GradeEntry = {
  course: string; // was classId before
  score: number;  // was grade before
};

export const saveGrades = (grades: GradeEntry[]) => {
  localStorage.setItem("grades", JSON.stringify(grades));
};

export const loadGrades = (): GradeEntry[] => {
  const saved = localStorage.getItem("grades");
  return saved ? JSON.parse(saved) : [];
};
