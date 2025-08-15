export interface Assignment {
    id: string;
    name: string;
    points: number;
    totalPoints: number;
    dueDate?: string;
    isCompleted: boolean;
    hypotheticalGrade?: number;
    canvasGrade?: number;
    weight?: number;
    groupName?: string;
    groupWeight?: number;
}

export interface CourseGrade {
    currentGrade: number;
    letterGrade: string;
    targetGrade: string;
    neededGrade?: number;
    progressPercentage: number;
}

export interface GradeWeights {
    [key: string]: number;
}

export interface GradeCalculation {
    canvasGrade: number;
    customGrade: number;
    difference: number;
}

export const letterGradeScale: { [key: string]: number } = {
    'A': 93,
    'A-': 90,
    'B+': 87,
    'B': 83,
    'B-': 80,
    'C+': 77,
    'C': 73,
    'C-': 70,
    'D+': 67,
    'D': 63,
    'D-': 60,
    'F': 0
}; 