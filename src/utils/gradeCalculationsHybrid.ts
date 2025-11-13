// Grade calculation utilities for hybrid manual/automated system
import {
    CourseGradeConfig,
    AssignmentWithCategory,
    GradeBreakdown,
    CourseGradeSummary,
    ManualAssignment
} from '../types/courseGradeConfig';

/**
 * Calculate grade percentage from points
 */
export function calculatePercentage(pointsEarned: number, pointsPossible: number): number {
    if (pointsPossible === 0) return 0;
    return (pointsEarned / pointsPossible) * 100;
}

/**
 * Get letter grade from percentage
 */
export function getLetterGrade(percentage: number): string {
    if (percentage >= 93) return 'A';
    if (percentage >= 90) return 'A-';
    if (percentage >= 87) return 'B+';
    if (percentage >= 83) return 'B';
    if (percentage >= 80) return 'B-';
    if (percentage >= 77) return 'C+';
    if (percentage >= 73) return 'C';
    if (percentage >= 70) return 'C-';
    if (percentage >= 67) return 'D+';
    if (percentage >= 63) return 'D';
    if (percentage >= 60) return 'D-';
    return 'F';
}

/**
 * Calculate category grade with drop lowest policy
 */
export function calculateCategoryGrade(
    assignments: AssignmentWithCategory[],
    dropLowest: number = 0
): number {
    if (assignments.length === 0) return 0;

    // Sort by percentage (ascending)
    const sorted = [...assignments].sort((a, b) => a.percentage - b.percentage);

    // Drop lowest N assignments
    const toUse = sorted.slice(dropLowest);

    if (toUse.length === 0) return 0;

    // Calculate weighted average by points
    const totalPointsEarned = toUse.reduce((sum, a) => sum + a.pointsEarned, 0);
    const totalPointsPossible = toUse.reduce((sum, a) => sum + a.pointsPossible, 0);

    return calculatePercentage(totalPointsEarned, totalPointsPossible);
}

/**
 * Calculate overall course grade from categories
 */
export function calculateOverallGrade(
    breakdowns: GradeBreakdown[]
): number {
    let totalWeighted = 0;
    let totalWeight = 0;

    breakdowns.forEach(breakdown => {
        if (breakdown.weight > 0) {
            totalWeighted += breakdown.currentPercentage * breakdown.weight;
            totalWeight += breakdown.weight;
        }
    });

    if (totalWeight === 0) return 0;
    return totalWeighted / totalWeight;
}

/**
 * Calculate grade breakdown by category
 */
export function calculateGradeBreakdown(
    config: CourseGradeConfig,
    canvasAssignments: AssignmentWithCategory[],
    manualAssignments: ManualAssignment[]
): GradeBreakdown[] {
    const breakdowns: GradeBreakdown[] = [];

    config.categories.forEach(category => {
        // Get all assignments in this category
        const categoryAssignments = [
            ...canvasAssignments.filter(a => a.categoryId === category.id),
            ...manualAssignments
                .filter(m => m.categoryId === category.id)
                .map(m => ({
                    id: m.id,
                    name: m.name,
                    pointsEarned: m.pointsEarned,
                    pointsPossible: m.pointsPossible,
                    percentage: calculatePercentage(m.pointsEarned, m.pointsPossible),
                    categoryId: m.categoryId,
                    categoryName: category.name,
                    dueDate: m.dueDate,
                    completed: m.completed,
                    source: 'manual' as const
                }))
        ];

        // Calculate category grade with drop lowest
        const categoryGrade = calculateCategoryGrade(
            categoryAssignments,
            category.dropLowest || 0
        );

        // Calculate weighted contribution
        const weightedContribution = (categoryGrade * category.weight) / 100;

        breakdowns.push({
            categoryId: category.id,
            categoryName: category.name,
            weight: category.weight,
            currentPercentage: categoryGrade,
            weightedContribution,
            assignments: categoryAssignments,
            droppedCount: category.dropLowest || 0
        });
    });

    return breakdowns;
}

/**
 * Calculate what grade is needed on remaining assignments to reach target
 */
export function calculateNeededGrade(
    breakdowns: GradeBreakdown[],
    targetPercentage: number
): number | null {
    // Calculate current weighted grade
    const currentGrade = calculateOverallGrade(breakdowns);

    // Calculate total weight of completed assignments
    let completedWeight = 0;
    let remainingWeight = 0;

    breakdowns.forEach(breakdown => {
        const completed = breakdown.assignments.filter(a => a.completed);
        const remaining = breakdown.assignments.filter(a => !a.completed);

        if (completed.length > 0) {
            const categoryCompletedGrade = calculateCategoryGrade(completed, 0);
            completedWeight += (categoryCompletedGrade * breakdown.weight) / 100;
        }

        if (remaining.length > 0) {
            remainingWeight += breakdown.weight;
        }
    });

    if (remainingWeight === 0) {
        // No remaining assignments
        return currentGrade >= targetPercentage ? null : targetPercentage;
    }

    // Calculate needed grade on remaining
    // target = (completedWeight + (neededGrade * remainingWeight / 100))
    // neededGrade = ((target - completedWeight) * 100) / remainingWeight
    const neededGrade = ((targetPercentage - completedWeight) * 100) / remainingWeight;

    return Math.max(0, Math.min(100, neededGrade));
}

/**
 * Generate complete grade summary for a course
 */
export function generateGradeSummary(
    config: CourseGradeConfig,
    canvasAssignments: AssignmentWithCategory[],
    manualAssignments: ManualAssignment[]
): CourseGradeSummary {
    const breakdowns = calculateGradeBreakdown(config, canvasAssignments, manualAssignments);
    const currentGrade = calculateOverallGrade(breakdowns);
    const letterGrade = getLetterGrade(currentGrade);

    // Calculate progress to target
    let progressToTarget = 0;
    let neededGrade: number | null = null;

    if (config.targetPercentage) {
        progressToTarget = (currentGrade / config.targetPercentage) * 100;
        neededGrade = calculateNeededGrade(breakdowns, config.targetPercentage);
    }

    // Count assignments
    const allAssignments = [
        ...canvasAssignments,
        ...manualAssignments.map(m => ({
            id: m.id,
            name: m.name,
            pointsEarned: m.pointsEarned,
            pointsPossible: m.pointsPossible,
            percentage: calculatePercentage(m.pointsEarned, m.pointsPossible),
            categoryId: m.categoryId,
            categoryName: config.categories.find(c => c.id === m.categoryId)?.name || 'Unknown',
            dueDate: m.dueDate,
            completed: m.completed,
            source: 'manual' as const
        }))
    ];

    const assignmentsRemaining = allAssignments.filter(a => !a.completed).length;
    const assignmentsCompleted = allAssignments.filter(a => a.completed).length;

    return {
        courseId: config.courseId,
        courseName: config.courseName,
        currentGrade,
        letterGrade,
        targetGrade: config.targetGrade,
        progressToTarget,
        neededGrade: neededGrade ?? undefined,
        breakdown: breakdowns,
        assignmentsRemaining,
        assignmentsCompleted
    };
}

/**
 * Calculate what-if scenario grade
 */
export function calculateWhatIfGrade(
    config: CourseGradeConfig,
    canvasAssignments: AssignmentWithCategory[],
    manualAssignments: ManualAssignment[],
    hypotheticalScores: { [assignmentId: string]: number }
): number {
    // Create modified assignments with hypothetical scores
    const modifiedCanvas = canvasAssignments.map(a => {
        if (hypotheticalScores[a.id] !== undefined) {
            return {
                ...a,
                percentage: hypotheticalScores[a.id],
                pointsEarned: (hypotheticalScores[a.id] / 100) * a.pointsPossible
            };
        }
        return a;
    });

    const modifiedManual = manualAssignments.map(m => {
        if (hypotheticalScores[m.id] !== undefined) {
            return {
                ...m,
                pointsEarned: (hypotheticalScores[m.id] / 100) * m.pointsPossible
            };
        }
        return m;
    });

    const breakdowns = calculateGradeBreakdown(config, modifiedCanvas, modifiedManual);
    return calculateOverallGrade(breakdowns);
}

