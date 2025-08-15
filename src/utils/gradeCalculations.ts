import { Assignment, CourseGrade, GradeWeights, letterGradeScale } from '../types/grades';

export const calculateGradeWithWeights = (assignments: Assignment[], weights: GradeWeights): number => {
    let totalWeightedScore = 0;
    let totalWeight = 0;

    assignments.forEach(assignment => {
        if (assignment.isCompleted || assignment.hypotheticalGrade !== undefined) {
            const grade = assignment.hypotheticalGrade ?? (assignment.points / assignment.totalPoints * 100);
            const weight = weights[assignment.id] || 0;
            totalWeightedScore += grade * weight;
            totalWeight += weight;
        }
    });

    return totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
};

export const getLetterGrade = (percentage: number): string => {
    for (const [letter, minScore] of Object.entries(letterGradeScale)) {
        if (percentage >= minScore) {
            return letter;
        }
    }
    return 'F';
};

export const calculateNeededGrade = (
    currentAssignments: Assignment[],
    remainingAssignments: Assignment[],
    targetGrade: number,
    weights: GradeWeights
): number => {
    const currentTotal = calculateGradeWithWeights(currentAssignments, weights);
    const currentWeight = currentAssignments.reduce((sum, a) => sum + (weights[a.id] || 0), 0);
    const remainingWeight = remainingAssignments.reduce((sum, a) => sum + (weights[a.id] || 0), 0);

    if (remainingWeight === 0) return 0;

    const neededScore = (targetGrade * (currentWeight + remainingWeight) - currentTotal * currentWeight) / remainingWeight;
    return Math.min(Math.max(neededScore, 0), 100);
};

export const calculateProgressPercentage = (
    currentGrade: number,
    targetGrade: number
): number => {
    return Math.min((currentGrade / targetGrade) * 100, 100);
};

// New function that uses CourseGrade type
export const calculateCourseGrade = (
    assignments: Assignment[],
    weights: GradeWeights,
    targetGrade: string
): CourseGrade => {
    const currentGrade = calculateGradeWithWeights(assignments, weights);
    const letterGrade = getLetterGrade(currentGrade);
    const remainingAssignments = assignments.filter(a => !a.isCompleted);
    const completedAssignments = assignments.filter(a => a.isCompleted);
    const targetPercentage = letterGradeScale[targetGrade as keyof typeof letterGradeScale];
    const neededGrade = calculateNeededGrade(
        completedAssignments,
        remainingAssignments,
        targetPercentage,
        weights
    );
    const progressPercentage = calculateProgressPercentage(currentGrade, targetPercentage);

    return {
        currentGrade,
        letterGrade,
        targetGrade,
        progressPercentage,
        neededGrade
    };
}; 