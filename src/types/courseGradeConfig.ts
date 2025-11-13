// Enhanced grade configuration types for hybrid manual/automated system

export interface GradeCategory {
    id: string;
    name: string; // e.g., "Exams", "Homework", "Projects", "Participation"
    weight: number; // Percentage (0-100)
    color: string; // For visualization
    dropLowest?: number; // Number of lowest scores to drop
    extraCredit?: boolean; // Whether this category allows extra credit
}

export interface CourseGradeConfig {
    courseId: string;
    courseName: string;
    canvasCourseId?: string; // Link to Canvas course if synced

    // Categories configuration
    categories: GradeCategory[];

    // Grade policies
    policies: {
        dropLowestCount?: number; // Global drop lowest across all categories
        roundingRule?: 'none' | 'round' | 'floor' | 'ceiling';
        scale?: 'standard' | 'custom'; // Standard A-F or custom scale
    };

    // Target grade
    targetGrade?: string; // 'A', 'B+', etc.
    targetPercentage?: number;

    // Last synced from Canvas
    lastCanvasSync?: string; // ISO date string

    // Manual overrides
    manualAssignments: ManualAssignment[];
    gradeOverrides: { [assignmentId: string]: number }; // Override Canvas grades
}

export interface ManualAssignment {
    id: string;
    name: string;
    categoryId: string;
    pointsEarned: number;
    pointsPossible: number;
    dueDate?: string;
    completed: boolean;
}

export interface AssignmentWithCategory {
    id: string;
    name: string;
    pointsEarned: number;
    pointsPossible: number;
    percentage: number;
    categoryId: string;
    categoryName: string;
    dueDate?: string;
    completed: boolean;
    source: 'canvas' | 'manual';
    canvasId?: string;
}

export interface GradeBreakdown {
    categoryId: string;
    categoryName: string;
    weight: number;
    currentPercentage: number;
    weightedContribution: number;
    assignments: AssignmentWithCategory[];
    droppedCount: number;
}

export interface CourseGradeSummary {
    courseId: string;
    courseName: string;
    currentGrade: number;
    letterGrade: string;
    targetGrade?: string;
    progressToTarget: number; // Percentage progress toward target
    neededGrade?: number; // Grade needed on remaining assignments
    breakdown: GradeBreakdown[];
    assignmentsRemaining: number;
    assignmentsCompleted: number;
}

