import React, { useState, useEffect } from 'react';
import GradeCalculator from '../components/GradeCalculator';
import { Assignment, GradeWeights } from '../types/grades';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

interface CourseViewProps {
    courseId: string;
}

const CourseView: React.FC<CourseViewProps> = ({ courseId }) => {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [weights, setWeights] = useState<GradeWeights>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourseData = async () => {
            setLoading(true);
            try {
                const courseRef = doc(db, 'courses', courseId);
                const courseSnap = await getDoc(courseRef);

                if (courseSnap.exists()) {
                    const data = courseSnap.data();

                    const res = await fetch(`/api/canvas-assignments?courseId=${courseId}`, {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' }
                    });

                    if (!res.ok) throw new Error(await res.text());

                    const canvasAssignments = await res.json();
                    const assignmentList: Assignment[] = canvasAssignments.map((assignment: any) => ({
                        id: assignment.id,
                        name: assignment.name,
                        points: assignment.score || 0,
                        totalPoints: assignment.points_possible || 0,
                        weight: assignment.group_weight || 0,
                        dueDate: assignment.due_at ? new Date(assignment.due_at) : undefined,
                        isCompleted: assignment.score !== null,
                        canvasGrade: assignment.score !== null ? (assignment.score / assignment.points_possible) * 100 : undefined
                    }));

                    setAssignments(assignmentList);

                    const canvasWeights = data.weights || {};
                    setWeights(canvasWeights);
                }
            } catch (err) {
                console.error('Error fetching course data:', err);
            } finally {
                setLoading(false);
            }
        };

        if (courseId) {
            fetchCourseData();
        }
    }, [courseId]);

    const handleAssignmentUpdate = async (updatedAssignment: Assignment) => {
        const updatedAssignments = assignments.map(a =>
            a.id === updatedAssignment.id ? updatedAssignment : a
        );
        setAssignments(updatedAssignments);

        const courseRef = doc(db, 'courses', courseId);
        await updateDoc(courseRef, {
            assignments: updatedAssignments,
            weights: {
                ...weights,
                [updatedAssignment.id]: updatedAssignment.weight || weights[updatedAssignment.id] || 0
            }
        });
    };

    const handleWeightsUpdate = async (newWeights: GradeWeights) => {
        setWeights(newWeights);

        const updatedAssignments = assignments.map(assignment => ({
            ...assignment,
            weight: newWeights[assignment.id] || assignment.weight || 0
        }));
        setAssignments(updatedAssignments);

        const courseRef = doc(db, 'courses', courseId);
        await updateDoc(courseRef, {
            weights: newWeights,
            assignments: updatedAssignments
        });
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-4 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <GradeCalculator
                courseId={courseId}
                assignments={assignments}
                onUpdateAssignment={handleAssignmentUpdate}
                onUpdateWeights={handleWeightsUpdate}
            />
        </div>
    );
};

export default CourseView; 