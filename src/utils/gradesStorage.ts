// utils/gradesStorage.ts
export type GradeEntry = {
  classId: string;
  grade: number;
};

export const saveGrades = (grades: GradeEntry[]) => {
  localStorage.setItem("grades", JSON.stringify(grades));
};

export const loadGrades = (): GradeEntry[] => {
  const saved = localStorage.getItem("grades");
  return saved ? JSON.parse(saved) : [];
};
