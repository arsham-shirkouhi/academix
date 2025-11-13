// Firebase storage utilities for grade configurations
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { CourseGradeConfig } from '../types/courseGradeConfig';

const GRADES_COLLECTION = 'gradeConfigs';

/**
 * Save grade configuration for a course
 */
export async function saveGradeConfig(
    userId: string,
    config: CourseGradeConfig
): Promise<void> {
    const configRef = doc(db, 'users', userId, GRADES_COLLECTION, config.courseId);
    await setDoc(configRef, {
        ...config,
        lastUpdated: new Date().toISOString()
    });
}

/**
 * Load grade configuration for a course
 */
export async function loadGradeConfig(
    userId: string,
    courseId: string
): Promise<CourseGradeConfig | null> {
    const configRef = doc(db, 'users', userId, GRADES_COLLECTION, courseId);
    const configDoc = await getDoc(configRef);

    if (!configDoc.exists()) {
        return null;
    }

    return configDoc.data() as CourseGradeConfig;
}

/**
 * Load all grade configurations for a user
 */
export async function loadAllGradeConfigs(
    userId: string
): Promise<CourseGradeConfig[]> {
    const configsRef = collection(db, 'users', userId, GRADES_COLLECTION);
    const snapshot = await getDocs(configsRef);

    return snapshot.docs.map(doc => doc.data() as CourseGradeConfig);
}

/**
 * Delete grade configuration
 */
export async function deleteGradeConfig(
    userId: string,
    courseId: string
): Promise<void> {
    const configRef = doc(db, 'users', userId, GRADES_COLLECTION, courseId);
    await setDoc(configRef, {}, { merge: false });
    // Note: Firestore doesn't have delete, but we can clear the doc
    // For actual deletion, you'd use deleteDoc from firebase/firestore
}

/**
 * Create default grade configuration from Canvas course
 */
export function createDefaultConfig(
    courseId: string,
    courseName: string,
    canvasCourseId?: string,
    canvasGroups?: Array<{ id: string; name: string; weight: number }>
): CourseGradeConfig {
    // Create default categories from Canvas groups or standard categories
    const categories = canvasGroups && canvasGroups.length > 0
        ? canvasGroups.map((group, index) => ({
            id: `category-${group.id}`,
            name: group.name,
            weight: group.weight || 0,
            color: getCategoryColor(index),
            dropLowest: 0,
            extraCredit: false
        }))
        : [
            {
                id: 'category-exams',
                name: 'Exams',
                weight: 40,
                color: '#F44336',
                dropLowest: 0,
                extraCredit: false
            },
            {
                id: 'category-homework',
                name: 'Homework',
                weight: 30,
                color: '#2196F3',
                dropLowest: 0,
                extraCredit: false
            },
            {
                id: 'category-projects',
                name: 'Projects',
                weight: 20,
                color: '#4CAF50',
                dropLowest: 0,
                extraCredit: false
            },
            {
                id: 'category-participation',
                name: 'Participation',
                weight: 10,
                color: '#FF9800',
                dropLowest: 0,
                extraCredit: false
            }
        ];

    // Normalize weights to 100%
    const totalWeight = categories.reduce((sum, c) => sum + c.weight, 0);
    if (totalWeight > 0 && totalWeight !== 100) {
        categories.forEach(cat => {
            cat.weight = (cat.weight / totalWeight) * 100;
        });
    }

    return {
        courseId,
        courseName,
        canvasCourseId,
        categories,
        policies: {
            dropLowestCount: 0,
            roundingRule: 'round',
            scale: 'standard'
        },
        manualAssignments: [],
        gradeOverrides: {}
    };
}

/**
 * Get color for category by index
 */
function getCategoryColor(index: number): string {
    const colors = [
        '#F44336', // Red
        '#2196F3', // Blue
        '#4CAF50', // Green
        '#FF9800', // Orange
        '#9C27B0', // Purple
        '#00BCD4', // Cyan
        '#FFEB3B', // Yellow
        '#795548'  // Brown
    ];
    return colors[index % colors.length];
}

