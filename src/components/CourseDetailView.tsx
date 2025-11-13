import { useState } from 'react';
import { CourseGradeConfig, CourseGradeSummary, GradeCategory } from '../types/courseGradeConfig';
import { calculateWhatIfGrade } from '../utils/gradeCalculationsHybrid';
import { getGradeColor } from '../utils/canvasApi';

interface CourseDetailViewProps {
    config: CourseGradeConfig;
    summary: CourseGradeSummary;
    onBack: () => void;
    onConfigUpdate: (config: CourseGradeConfig) => void;
}

export default function CourseDetailView({
    config,
    summary,
    onBack,
    onConfigUpdate
}: CourseDetailViewProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'categories' | 'assignments' | 'calculator'>('overview');
    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [whatIfScores, setWhatIfScores] = useState<{ [key: string]: number }>({});

    const handleCategoryWeightChange = (categoryId: string, newWeight: number) => {
        const updatedCategories = config.categories.map(cat =>
            cat.id === categoryId ? { ...cat, weight: newWeight } : cat
        );

        // Normalize weights to 100%
        const totalWeight = updatedCategories.reduce((sum, c) => sum + c.weight, 0);
        if (totalWeight > 0) {
            updatedCategories.forEach(cat => {
                cat.weight = (cat.weight / totalWeight) * 100;
            });
        }

        onConfigUpdate({
            ...config,
            categories: updatedCategories
        });
    };

    const handleAddCategory = () => {
        const newCategory: GradeCategory = {
            id: `category-${Date.now()}`,
            name: 'New Category',
            weight: 0,
            color: '#9E9E9E',
            dropLowest: 0,
            extraCredit: false
        };

        onConfigUpdate({
            ...config,
            categories: [...config.categories, newCategory]
        });
        setEditingCategory(newCategory.id);
    };

    const handleDeleteCategory = (categoryId: string) => {
        if (config.categories.length <= 1) {
            alert('You must have at least one category');
            return;
        }

        onConfigUpdate({
            ...config,
            categories: config.categories.filter(c => c.id !== categoryId)
        });
    };

    const handleTargetGradeChange = (targetGrade: string) => {
        const letterGradeScale: { [key: string]: number } = {
            'A': 93, 'A-': 90, 'B+': 87, 'B': 83, 'B-': 80,
            'C+': 77, 'C': 73, 'C-': 70, 'D+': 67, 'D': 63, 'D-': 60, 'F': 0
        };

        onConfigUpdate({
            ...config,
            targetGrade,
            targetPercentage: letterGradeScale[targetGrade] || undefined
        });
    };

    const whatIfGrade = whatIfScores && Object.keys(whatIfScores).length > 0
        ? calculateWhatIfGrade(config, [], config.manualAssignments, whatIfScores)
        : summary.currentGrade;

    return (
        <div style={{
            padding: '15px',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
                paddingBottom: '1rem',
                borderBottom: '3px solid #1F0741'
            }}>
                <div>
                    <button
                        onClick={onBack}
                        style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#FFFBF1',
                            color: '#1F0741',
                            border: '2px solid #1F0741',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            marginBottom: '0.5rem',
                            fontWeight: 'bold'
                        }}
                    >
                        ← Back
                    </button>
                    <h2 style={{
                        fontSize: '32px',
                        fontWeight: '900',
                        color: '#1f0741',
                        margin: 0
                    }}>
                        {config.courseName}
                    </h2>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: getGradeColor(summary.currentGrade) }}>
                        {summary.currentGrade.toFixed(1)}%
                    </div>
                    <div style={{ fontSize: '1.25rem', color: '#666' }}>
                        {summary.letterGrade}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '1.5rem',
                borderBottom: '2px solid #e0e0e0'
            }}>
                {(['overview', 'categories', 'assignments', 'calculator'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: activeTab === tab ? '#1F0741' : '#FFFBF1',
                            color: activeTab === tab ? '#FFFBF1' : '#1F0741',
                            border: `2px solid #1F0741`,
                            borderBottom: 'none',
                            borderRadius: '8px 8px 0 0',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            textTransform: 'capitalize',
                            fontSize: '14px'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '1rem' }}>
                {activeTab === 'overview' && (
                    <OverviewTab summary={summary} config={config} />
                )}

                {activeTab === 'categories' && (
                    <CategoriesTab
                        categories={config.categories}
                        onWeightChange={handleCategoryWeightChange}
                        onAdd={handleAddCategory}
                        onDelete={handleDeleteCategory}
                        editingCategory={editingCategory}
                        setEditingCategory={setEditingCategory}
                    />
                )}

                {activeTab === 'assignments' && (
                    <AssignmentsTab
                        summary={summary}
                        config={config}
                        onConfigUpdate={onConfigUpdate}
                    />
                )}

                {activeTab === 'calculator' && (
                    <CalculatorTab
                        summary={summary}
                        config={config}
                        whatIfScores={whatIfScores}
                        setWhatIfScores={setWhatIfScores}
                        whatIfGrade={whatIfGrade}
                        onTargetGradeChange={handleTargetGradeChange}
                    />
                )}
            </div>
        </div>
    );
}

// Overview Tab Component
function OverviewTab({ summary, config }: { summary: CourseGradeSummary; config: CourseGradeConfig }) {
    const totalWeight = config.categories.reduce((sum, c) => sum + c.weight, 0);

    return (
        <div>
            {/* Grade breakdown by category */}
            <div style={{
                backgroundColor: '#FFFBF1',
                border: '3px solid #1F0741',
                borderRadius: '16px',
                padding: '1.5rem',
                marginBottom: '1.5rem'
            }}>
                <h3 style={{ marginTop: 0, color: '#1F0741', marginBottom: '1rem' }}>
                    Grade Breakdown by Category
                </h3>

                {summary.breakdown.map(breakdown => {
                    const category = config.categories.find(c => c.id === breakdown.categoryId);
                    return (
                        <div key={breakdown.categoryId} style={{ marginBottom: '1rem' }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '0.5rem'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div
                                        style={{
                                            width: '16px',
                                            height: '16px',
                                            backgroundColor: category?.color || '#9E9E9E',
                                            borderRadius: '4px'
                                        }}
                                    />
                                    <span style={{ fontWeight: 'bold', color: '#1F0741' }}>
                                        {breakdown.categoryName}
                                    </span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 'bold', color: getGradeColor(breakdown.currentPercentage) }}>
                                        {breakdown.currentPercentage.toFixed(1)}%
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: '#666' }}>
                                        {breakdown.weight.toFixed(1)}% weight
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                width: '100%',
                                height: '20px',
                                backgroundColor: '#e0e0e0',
                                borderRadius: '10px',
                                overflow: 'hidden',
                                border: '2px solid #1F0741'
                            }}>
                                <div
                                    style={{
                                        height: '100%',
                                        width: `${breakdown.currentPercentage}%`,
                                        backgroundColor: category?.color || '#9E9E9E',
                                        transition: 'width 0.3s ease'
                                    }}
                                />
                            </div>

                            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                                {breakdown.assignments.length} assignments
                                {breakdown.droppedCount > 0 && ` (${breakdown.droppedCount} dropped)`}
                            </div>
                        </div>
                    );
                })}

                {totalWeight !== 100 && (
                    <div style={{
                        padding: '0.75rem',
                        backgroundColor: '#FFF3CD',
                        border: '2px solid #FFC107',
                        borderRadius: '8px',
                        marginTop: '1rem',
                        color: '#856404'
                    }}>
                        ⚠️ Total category weights: {totalWeight.toFixed(1)}% (should be 100%)
                    </div>
                )}
            </div>

            {/* Target grade progress */}
            {config.targetGrade && (
                <div style={{
                    backgroundColor: '#FFFBF1',
                    border: '3px solid #1F0741',
                    borderRadius: '16px',
                    padding: '1.5rem'
                }}>
                    <h3 style={{ marginTop: 0, color: '#1F0741', marginBottom: '1rem' }}>
                        Progress to {config.targetGrade}
                    </h3>
                    <div style={{
                        width: '100%',
                        height: '30px',
                        backgroundColor: '#e0e0e0',
                        borderRadius: '15px',
                        overflow: 'hidden',
                        border: '3px solid #1F0741',
                        marginBottom: '0.5rem'
                    }}>
                        <div
                            style={{
                                height: '100%',
                                width: `${Math.min(100, summary.progressToTarget)}%`,
                                backgroundColor: summary.progressToTarget >= 100 ? '#4CAF50' : '#FF9800',
                                transition: 'width 0.3s ease'
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#666' }}>
                        <span>{summary.progressToTarget.toFixed(1)}% complete</span>
                        {summary.neededGrade !== undefined && summary.neededGrade !== null && (
                            <span style={{ fontWeight: 'bold', color: '#1F0741' }}>
                                Need {summary.neededGrade.toFixed(1)}% on remaining
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Categories Tab Component
function CategoriesTab({
    categories,
    onWeightChange,
    onAdd,
    onDelete,
    editingCategory: _editingCategory,
    setEditingCategory: _setEditingCategory
}: {
    categories: GradeCategory[];
    onWeightChange: (id: string, weight: number) => void;
    onAdd: () => void;
    onDelete: (id: string) => void;
    editingCategory: string | null;
    setEditingCategory: (id: string | null) => void;
}) {
    const totalWeight = categories.reduce((sum, c) => sum + c.weight, 0);

    return (
        <div>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem'
            }}>
                <h3 style={{ margin: 0, color: '#1F0741' }}>Grade Categories</h3>
                <button
                    onClick={onAdd}
                    style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#4CAF50',
                        color: '#FFFBF1',
                        border: '2px solid #1F0741',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    + Add Category
                </button>
            </div>

            <div style={{
                backgroundColor: '#FFFBF1',
                border: '3px solid #1F0741',
                borderRadius: '16px',
                padding: '1.5rem'
            }}>
                {categories.map(category => (
                    <div
                        key={category.id}
                        style={{
                            padding: '1rem',
                            marginBottom: '1rem',
                            backgroundColor: '#FFFBF1',
                            border: '2px solid #1F0741',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem'
                        }}
                    >
                        <div
                            style={{
                                width: '24px',
                                height: '24px',
                                backgroundColor: category.color,
                                borderRadius: '6px',
                                border: '2px solid #1F0741'
                            }}
                        />

                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold', color: '#1F0741', marginBottom: '0.5rem' }}>
                                {category.name}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: '#666' }}>
                                Drop lowest: {category.dropLowest || 0} |
                                Extra credit: {category.extraCredit ? 'Yes' : 'No'}
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={category.weight.toFixed(1)}
                                onChange={(e) => onWeightChange(category.id, parseFloat(e.target.value) || 0)}
                                style={{
                                    width: '80px',
                                    padding: '0.5rem',
                                    border: '2px solid #1F0741',
                                    borderRadius: '6px',
                                    textAlign: 'right'
                                }}
                            />
                            <span style={{ fontWeight: 'bold', color: '#1F0741' }}>%</span>
                            <button
                                onClick={() => onDelete(category.id)}
                                style={{
                                    padding: '0.5rem',
                                    backgroundColor: '#F44336',
                                    color: '#FFFBF1',
                                    border: '2px solid #1F0741',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                ×
                            </button>
                        </div>
                    </div>
                ))}

                <div style={{
                    padding: '1rem',
                    marginTop: '1rem',
                    backgroundColor: totalWeight === 100 ? '#E8F5E9' : '#FFF3CD',
                    border: `2px solid ${totalWeight === 100 ? '#4CAF50' : '#FFC107'}`,
                    borderRadius: '8px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    color: totalWeight === 100 ? '#2E7D32' : '#856404'
                }}>
                    Total Weight: {totalWeight.toFixed(1)}%
                    {totalWeight !== 100 && ' (should be 100%)'}
                </div>
            </div>
        </div>
    );
}

// Assignments Tab Component
function AssignmentsTab({
    summary,
    config: _config,
    onConfigUpdate: _onConfigUpdate
}: {
    summary: CourseGradeSummary;
    config: CourseGradeConfig;
    onConfigUpdate: (config: CourseGradeConfig) => void;
}) {
    return (
        <div>
            <h3 style={{ color: '#1F0741', marginBottom: '1rem' }}>Assignments</h3>
            <div style={{
                backgroundColor: '#FFFBF1',
                border: '3px solid #1F0741',
                borderRadius: '16px',
                padding: '1.5rem'
            }}>
                {summary.breakdown.map(breakdown => (
                    <div key={breakdown.categoryId} style={{ marginBottom: '2rem' }}>
                        <h4 style={{ color: '#1F0741', marginBottom: '0.75rem' }}>
                            {breakdown.categoryName}
                        </h4>
                        {breakdown.assignments.length === 0 ? (
                            <div style={{ color: '#666', fontStyle: 'italic' }}>No assignments</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {breakdown.assignments.map(assignment => (
                                    <div
                                        key={assignment.id}
                                        style={{
                                            padding: '0.75rem',
                                            backgroundColor: '#FFFBF1',
                                            border: '2px solid #1F0741',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 'bold', color: '#1F0741' }}>
                                                {assignment.name}
                                            </div>
                                            <div style={{ fontSize: '0.875rem', color: '#666' }}>
                                                {assignment.pointsEarned} / {assignment.pointsPossible} points
                                                {assignment.dueDate && ` • Due: ${new Date(assignment.dueDate).toLocaleDateString()}`}
                                            </div>
                                        </div>
                                        <div style={{
                                            fontSize: '1.25rem',
                                            fontWeight: 'bold',
                                            color: getGradeColor(assignment.percentage)
                                        }}>
                                            {assignment.percentage.toFixed(1)}%
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// Calculator Tab Component
function CalculatorTab({
    summary,
    config,
    whatIfScores,
    setWhatIfScores: _setWhatIfScores,
    whatIfGrade,
    onTargetGradeChange
}: {
    summary: CourseGradeSummary;
    config: CourseGradeConfig;
    whatIfScores: { [key: string]: number };
    setWhatIfScores: (scores: { [key: string]: number }) => void;
    whatIfGrade: number;
    onTargetGradeChange: (grade: string) => void;
}) {
    const letterGradeScale: { [key: string]: number } = {
        'A': 93, 'A-': 90, 'B+': 87, 'B': 83, 'B-': 80,
        'C+': 77, 'C': 73, 'C-': 70, 'D+': 67, 'D': 63, 'D-': 60, 'F': 0
    };

    return (
        <div>
            <div style={{
                backgroundColor: '#FFFBF1',
                border: '3px solid #1F0741',
                borderRadius: '16px',
                padding: '1.5rem',
                marginBottom: '1.5rem'
            }}>
                <h3 style={{ marginTop: 0, color: '#1F0741', marginBottom: '1rem' }}>
                    Set Target Grade
                </h3>
                <select
                    value={config.targetGrade || ''}
                    onChange={(e) => onTargetGradeChange(e.target.value)}
                    style={{
                        padding: '0.75rem',
                        fontSize: '1rem',
                        border: '2px solid #1F0741',
                        borderRadius: '8px',
                        backgroundColor: '#FFFBF1',
                        color: '#1F0741',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}
                >
                    <option value="">No target</option>
                    {Object.keys(letterGradeScale).map(grade => (
                        <option key={grade} value={grade}>{grade}</option>
                    ))}
                </select>
                {config.targetGrade && config.targetPercentage && (
                    <div style={{ marginTop: '1rem', color: '#666' }}>
                        Target: {config.targetPercentage}% ({config.targetGrade})
                        {summary.neededGrade !== undefined && summary.neededGrade !== null && (
                            <div style={{ marginTop: '0.5rem', fontWeight: 'bold', color: '#1F0741' }}>
                                You need {summary.neededGrade.toFixed(1)}% on remaining assignments
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div style={{
                backgroundColor: '#FFFBF1',
                border: '3px solid #1F0741',
                borderRadius: '16px',
                padding: '1.5rem'
            }}>
                <h3 style={{ marginTop: 0, color: '#1F0741', marginBottom: '1rem' }}>
                    What-If Calculator
                </h3>
                <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#E3F2FD', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
                        Current Grade
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: getGradeColor(summary.currentGrade) }}>
                        {summary.currentGrade.toFixed(1)}%
                    </div>
                </div>

                {Object.keys(whatIfScores).length > 0 && (
                    <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#FFF9C4', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
                            What-If Grade
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: getGradeColor(whatIfGrade) }}>
                            {whatIfGrade.toFixed(1)}%
                        </div>
                        <div style={{ fontSize: '1rem', color: '#666', marginTop: '0.25rem' }}>
                            Change: {(whatIfGrade - summary.currentGrade).toFixed(1)}%
                        </div>
                    </div>
                )}

                <div style={{ fontSize: '0.875rem', color: '#666', fontStyle: 'italic' }}>
                    Enter hypothetical scores for assignments to see how they affect your grade
                </div>
            </div>
        </div>
    );
}

