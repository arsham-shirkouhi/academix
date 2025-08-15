import React, { useState, useEffect } from 'react';
import {
    Assignment,
    CourseGrade,
    GradeWeights,
    letterGradeScale
} from '../types/grades';
import {
    calculateGradeWithWeights,
    getLetterGrade,
    calculateNeededGrade,
    calculateProgressPercentage
} from '../utils/gradeCalculations';
import { getUserSettings } from '../utils/firestoreUser';
import { auth } from '../firebase';

interface WeightSection {
    id: string;
    name: string;
    weight: number;
    assignments: string[]; // Array of assignment IDs in this section
}

interface GradeCalculatorProps {
    courseId: string;
    assignments: Assignment[];
    onUpdateAssignment: (assignment: Assignment) => void;
    onUpdateWeights: (weights: GradeWeights) => void;
}

const GradeCalculator: React.FC<GradeCalculatorProps> = ({
    courseId,
    assignments: initialAssignments,
    onUpdateAssignment,
    onUpdateWeights
}) => {
    const [weights, setWeights] = useState<GradeWeights>({});
    const [targetGrade, setTargetGrade] = useState<string>('A');
    const [customGrades, setCustomGrades] = useState<{ [key: string]: number }>({});
    const [showCustomWeights, setShowCustomWeights] = useState(false);
    const [weightSections, setWeightSections] = useState<WeightSection[]>([]);
    const [newSectionName, setNewSectionName] = useState('');
    const [newSectionWeight, setNewSectionWeight] = useState('');
    const [canvasAssignments, setCanvasAssignments] = useState<Assignment[]>([]);
    const [showWeightWarning, setShowWeightWarning] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
    const [retryCount, setRetryCount] = useState(0);

    const remainingAssignments = assignments.filter(a => !a.isCompleted);
    const completedAssignments = assignments.filter(a => a.isCompleted);

    const currentGrade = calculateGradeWithWeights(assignments, weights);
    const letterGrade = getLetterGrade(currentGrade);

    const targetPercentage = letterGradeScale[targetGrade as keyof typeof letterGradeScale];
    const neededGrade = calculateNeededGrade(
        completedAssignments,
        remainingAssignments,
        targetPercentage,
        weights
    );

    const progressPercentage = calculateProgressPercentage(currentGrade, targetPercentage);

    // Fetch Canvas data
    useEffect(() => {
        const fetchCanvasData = async () => {
            setLoading(true);
            setError(null);

            try {
                const user = auth.currentUser;
                if (!user) {
                    throw new Error('Please sign in to view your grades');
                }

                const settings = await getUserSettings(user.uid);
                if (!settings?.token || !settings?.domain) {
                    throw new Error('Please configure your Canvas settings in the profile page');
                }

                console.log('Fetching Canvas data with:', {
                    courseId,
                    domain: settings.domain.replace(/^https?:\/\//, '')
                });

                const response = await fetch('/api/canvas-assignments', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        token: settings.token,
                        domain: settings.domain.replace(/^https?:\/\//, ''),
                        courseId
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => null);
                    console.error('Canvas API Error:', errorData);
                    throw new Error(
                        errorData?.details ||
                        `Failed to fetch Canvas data (${response.status})`
                    );
                }

                const data = await response.json();
                console.log('Received Canvas data:', {
                    assignmentsCount: data.assignments?.length,
                    groupsCount: data.groups?.length
                });

                if (!data.assignments || !Array.isArray(data.assignments)) {
                    throw new Error('Invalid assignment data received from Canvas');
                }

                // Update assignments with Canvas data
                setCanvasAssignments(data.assignments);
                setAssignments(data.assignments);

                // Initialize weight sections from Canvas groups
                if (!showCustomWeights) {
                    const canvasWeights: GradeWeights = {};
                    data.assignments.forEach((assignment: Assignment) => {
                        canvasWeights[assignment.id] = assignment.weight || 0;
                    });
                    setWeights(canvasWeights);
                    onUpdateWeights(canvasWeights);
                }

                // Initialize weight sections if in custom mode and no sections exist
                if (showCustomWeights && weightSections.length === 0 && data.groups) {
                    setWeightSections(data.groups.map((group: any) => ({
                        id: group.id,
                        name: group.name,
                        weight: group.weight,
                        assignments: group.assignments.map((a: Assignment) => a.id)
                    })));
                }
            } catch (err) {
                console.error('Error fetching Canvas data:', err);
                const errorMessage = err instanceof Error ? err.message : 'Failed to fetch Canvas data';
                setError(errorMessage);

                // Retry logic for certain errors
                if (retryCount < 3 && errorMessage.includes('Failed to fetch')) {
                    setRetryCount(prev => prev + 1);
                    setTimeout(() => {
                        console.log('Retrying Canvas data fetch...');
                        fetchCanvasData();
                    }, 2000 * (retryCount + 1)); // Exponential backoff
                }
            } finally {
                setLoading(false);
            }
        };

        fetchCanvasData();
    }, [courseId, showCustomWeights]);

    useEffect(() => {
        const newCustomGrades: { [key: string]: number } = {};
        assignments.forEach(assignment => {
            if (assignment.hypotheticalGrade !== undefined) {
                newCustomGrades[assignment.id] = assignment.hypotheticalGrade;
            }
        });
        setCustomGrades(newCustomGrades);
    }, [assignments]);

    // Update weights when weight sections change
    useEffect(() => {
        const newWeights: GradeWeights = {};
        weightSections.forEach(section => {
            const weightPerAssignment = section.weight / section.assignments.length;
            section.assignments.forEach(assignmentId => {
                newWeights[assignmentId] = weightPerAssignment;
            });
        });

        setWeights(newWeights);
        onUpdateWeights(newWeights);
    }, [weightSections, onUpdateWeights]);

    // Toggle between Canvas and custom weights
    const toggleWeightMode = () => {
        setShowCustomWeights(prev => {
            if (!prev) {
                // Switching to custom weights - initialize from Canvas if no custom weights
                if (weightSections.length === 0) {
                    // Group Canvas assignments by their group type
                    const groupedAssignments = canvasAssignments.reduce((groups: { [key: string]: Assignment[] }, assignment) => {
                        const groupName = assignment.groupName || 'Other';
                        if (!groups[groupName]) {
                            groups[groupName] = [];
                        }
                        groups[groupName].push(assignment);
                        return groups;
                    }, {});

                    // Create weight sections from Canvas groups
                    const initialSections: WeightSection[] = Object.entries(groupedAssignments).map(([name, groupAssignments]) => ({
                        id: Date.now().toString() + name,
                        name,
                        weight: groupAssignments[0]?.weight || 0,
                        assignments: groupAssignments.map(a => a.id)
                    }));

                    setWeightSections(initialSections);
                }
            } else {
                // Switching back to Canvas weights
                const canvasWeights: GradeWeights = {};
                canvasAssignments.forEach(assignment => {
                    canvasWeights[assignment.id] = assignment.weight || 0;
                });
                setWeights(canvasWeights);
                onUpdateWeights(canvasWeights);
            }
            return !prev;
        });
    };

    const handleWeightChange = (sectionId: string, newWeight: number) => {
        setWeightSections(prev => {
            const updated = prev.map(section =>
                section.id === sectionId ? { ...section, weight: newWeight } : section
            );

            const totalWeight = updated.reduce((sum, section) => sum + section.weight, 0);
            setShowWeightWarning(totalWeight > 100);

            return updated;
        });
    };

    const courseGrade: CourseGrade = {
        currentGrade,
        letterGrade,
        targetGrade,
        progressPercentage,
        neededGrade
    };

    const handleHypotheticalGrade = (assignment: Assignment, grade: number) => {
        const updatedAssignment = {
            ...assignment,
            hypotheticalGrade: grade
        };
        setCustomGrades(prev => ({
            ...prev,
            [assignment.id]: grade
        }));
        onUpdateAssignment(updatedAssignment);
    };

    const addWeightSection = () => {
        if (!newSectionName || !newSectionWeight) return;

        const newSection: WeightSection = {
            id: Date.now().toString(),
            name: newSectionName,
            weight: Number(newSectionWeight),
            assignments: []
        };

        setWeightSections(prev => [...prev, newSection]);
        setNewSectionName('');
        setNewSectionWeight('');
    };

    const removeWeightSection = (sectionId: string) => {
        setWeightSections(prev => prev.filter(section => section.id !== sectionId));
    };

    const assignToSection = (assignmentId: string, sectionId: string) => {
        setWeightSections(prev => {
            const cleaned = prev.map(section => ({
                ...section,
                assignments: section.assignments.filter(id => id !== assignmentId)
            }));

            return cleaned.map(section =>
                section.id === sectionId
                    ? { ...section, assignments: [...section.assignments, assignmentId] }
                    : section
            );
        });
    };

    const revertToCanvasGrade = (assignment: Assignment) => {
        const updatedAssignment = {
            ...assignment,
            hypotheticalGrade: undefined
        };
        setCustomGrades(prev => {
            const newGrades = { ...prev };
            delete newGrades[assignment.id];
            return newGrades;
        });
        onUpdateAssignment(updatedAssignment);
    };

    if (loading) {
        return (
            <div className="p-6 bg-white rounded-lg shadow-lg">
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

    if (error) {
        return (
            <div className="p-6 bg-white rounded-lg shadow-lg">
                <div className="text-red-500 bg-red-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Error Loading Grades</h3>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white rounded-lg shadow-lg">
            {/* Grade Summary Section */}
            <div className="mb-8">
                <h3 className="text-xl font-bold mb-4">Grade Summary</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="text-lg font-semibold">Current Grade</h4>
                        <p className="text-3xl font-bold">{courseGrade.currentGrade.toFixed(1)}%</p>
                        <p className="text-xl">{courseGrade.letterGrade}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="text-lg font-semibold">Target Grade</h4>
                        <select
                            value={courseGrade.targetGrade}
                            onChange={(e) => setTargetGrade(e.target.value)}
                            className="mt-2 p-2 border rounded"
                        >
                            {Object.keys(letterGradeScale).map(grade => (
                                <option key={grade} value={grade}>{grade}</option>
                            ))}
                        </select>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="text-lg font-semibold">Needed Grade</h4>
                        <p className="text-3xl font-bold">{courseGrade.neededGrade?.toFixed(1)}%</p>
                        <p className="text-sm">on remaining assignments</p>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
                <h3 className="text-lg font-semibold mb-2">Progress to {courseGrade.targetGrade}</h3>
                <div className="w-full h-4 bg-gray-200 rounded-full">
                    <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${courseGrade.progressPercentage}%` }}
                    />
                </div>
                <p className="text-sm mt-1">{courseGrade.progressPercentage.toFixed(1)}% complete</p>
                <p className="text-sm text-gray-600">
                    {remainingAssignments.length} assignment{remainingAssignments.length !== 1 ? 's' : ''} remaining
                </p>
            </div>

            {/* Weight Configuration */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Grade Weights</h3>
                    <button
                        onClick={toggleWeightMode}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        {showCustomWeights ? 'Use Canvas Weights' : 'Custom Weights'}
                    </button>
                </div>

                {/* Weight Mode Notice */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg text-sm">
                    {showCustomWeights ? (
                        <div>
                            <p className="mb-2">
                                <span className="font-semibold">Custom Weight Mode:</span> Changes will be saved to your account for a better experience.
                                Your actual Canvas grades won't be affected.
                            </p>
                            <p className="text-gray-600">
                                Current weights are based on {canvasAssignments.length} assignments from Canvas.
                            </p>
                        </div>
                    ) : (
                        <div>
                            <p className="mb-2">
                                <span className="font-semibold">Canvas Weight Mode:</span> Using original Canvas weights.
                                No changes will be saved to maintain privacy.
                            </p>
                            <p className="text-gray-600">
                                Using weights for {canvasAssignments.length} assignments from Canvas.
                            </p>
                        </div>
                    )}
                </div>

                {showCustomWeights && (
                    <div className="space-y-6">
                        {/* Add New Section */}
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-semibold mb-3">Add Weight Section</h4>
                            <div className="flex gap-4">
                                <input
                                    type="text"
                                    value={newSectionName}
                                    onChange={(e) => setNewSectionName(e.target.value)}
                                    placeholder="Section Name (e.g., Quizzes)"
                                    className="flex-1 p-2 border rounded"
                                />
                                <input
                                    type="number"
                                    value={newSectionWeight}
                                    onChange={(e) => setNewSectionWeight(e.target.value)}
                                    placeholder="Weight %"
                                    min="0"
                                    max="100"
                                    className="w-24 p-2 border rounded"
                                />
                                <button
                                    onClick={addWeightSection}
                                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                >
                                    Add
                                </button>
                            </div>
                        </div>

                        {/* Weight Sections */}
                        {weightSections.map(section => (
                            <div key={section.id} className="p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-semibold">{section.name}</h4>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="number"
                                            value={section.weight}
                                            onChange={(e) => handleWeightChange(section.id, Number(e.target.value))}
                                            min="0"
                                            max="100"
                                            className="w-20 p-1 border rounded"
                                        />
                                        <span>%</span>
                                        <button
                                            onClick={() => removeWeightSection(section.id)}
                                            className="text-red-500 hover:text-red-600"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>

                                {/* Assignments in this section */}
                                <div className="space-y-2">
                                    {assignments
                                        .filter(a => section.assignments.includes(a.id))
                                        .map(assignment => (
                                            <div key={assignment.id} className="flex justify-between items-center">
                                                <span>{assignment.name}</span>
                                                <button
                                                    onClick={() => assignToSection(assignment.id, '')}
                                                    className="text-sm text-gray-500 hover:text-gray-700"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        ))}

                        {showWeightWarning && (
                            <div className="text-yellow-600 bg-yellow-50 p-3 rounded-lg">
                                Warning: Total weights exceed 100%
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Assignments List */}
            <div>
                <h3 className="text-lg font-semibold mb-4">Assignments</h3>
                <div className="space-y-4">
                    {assignments.map(assignment => (
                        <div
                            key={assignment.id}
                            className="p-4 bg-gray-50 rounded-lg flex items-center justify-between"
                        >
                            <div>
                                <h4 className="font-semibold">{assignment.name}</h4>
                                <p className="text-sm text-gray-600">
                                    {assignment.points} / {assignment.totalPoints} points
                                    {assignment.weight && ` (${assignment.weight.toFixed(1)}%)`}
                                </p>
                                {assignment.groupName && (
                                    <p className="text-xs text-gray-500">
                                        Group: {assignment.groupName} ({assignment.groupWeight}% total)
                                    </p>
                                )}
                                {showCustomWeights && (
                                    <select
                                        value={weightSections.find(s => s.assignments.includes(assignment.id))?.id || ''}
                                        onChange={(e) => assignToSection(assignment.id, e.target.value)}
                                        className="mt-2 p-1 text-sm border rounded"
                                    >
                                        <option value="">Assign to section...</option>
                                        {weightSections.map(section => (
                                            <option key={section.id} value={section.id}>
                                                {section.name}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <div className="flex items-center space-x-4">
                                {assignment.canvasGrade !== undefined && (
                                    <span className="text-gray-600">
                                        Canvas: {assignment.canvasGrade.toFixed(1)}%
                                    </span>
                                )}
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={customGrades[assignment.id] || ''}
                                    onChange={(e) => handleHypotheticalGrade(assignment, Number(e.target.value))}
                                    placeholder="What if?"
                                    className="w-24 p-2 border rounded"
                                />
                                {assignment.hypotheticalGrade !== undefined && (
                                    <button
                                        onClick={() => revertToCanvasGrade(assignment)}
                                        className="text-sm text-red-500 hover:text-red-600"
                                    >
                                        Revert
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default GradeCalculator; 