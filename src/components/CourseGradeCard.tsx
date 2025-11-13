import { CourseGradeSummary } from '../types/courseGradeConfig';
import { getGradeColor } from '../utils/canvasApi';

interface CourseGradeCardProps {
    summary: CourseGradeSummary;
    onClick: () => void;
}

export default function CourseGradeCard({ summary, onClick }: CourseGradeCardProps) {
    const gradeColor = getGradeColor(summary.currentGrade);
    const progressColor = summary.progressToTarget >= 100 ? '#4CAF50' : '#FF9800';

    return (
        <div
            onClick={onClick}
            style={{
                border: '3px solid #1F0741',
                borderRadius: '16px',
                padding: '1.5rem',
                backgroundColor: '#FFFBF1',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(31, 7, 65, 0.2)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            {/* Left color indicator */}
            <div
                style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '8px',
                    backgroundColor: gradeColor,
                    borderTopLeftRadius: '13px',
                    borderBottomLeftRadius: '13px'
                }}
            />

            {/* Course name */}
            <h3
                style={{
                    margin: '0 0 1rem 0',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: '#1F0741',
                    paddingLeft: '1rem'
                }}
            >
                {summary.courseName}
            </h3>

            {/* Grade display */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem',
                    paddingLeft: '1rem'
                }}
            >
                <div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: gradeColor }}>
                        {summary.currentGrade.toFixed(1)}%
                    </div>
                    <div style={{ fontSize: '1.25rem', color: '#666', marginTop: '0.25rem' }}>
                        {summary.letterGrade}
                    </div>
                </div>

                {summary.targetGrade && (
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
                            Target: {summary.targetGrade}
                        </div>
                        <div style={{ fontSize: '1rem', fontWeight: 'bold', color: progressColor }}>
                            {summary.progressToTarget.toFixed(1)}%
                        </div>
                    </div>
                )}
            </div>

            {/* Progress bar to target */}
            {summary.targetGrade && (
                <div style={{ marginBottom: '1rem', paddingLeft: '1rem' }}>
                    <div
                        style={{
                            width: '100%',
                            height: '12px',
                            backgroundColor: '#e0e0e0',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            border: '2px solid #1F0741'
                        }}
                    >
                        <div
                            style={{
                                height: '100%',
                                width: `${Math.min(100, summary.progressToTarget)}%`,
                                backgroundColor: progressColor,
                                transition: 'width 0.3s ease'
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Assignment stats */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.875rem',
                    color: '#666',
                    paddingLeft: '1rem',
                    paddingTop: '0.5rem',
                    borderTop: '2px solid #e0e0e0'
                }}
            >
                <span>
                    {summary.assignmentsCompleted} completed
                </span>
                <span>
                    {summary.assignmentsRemaining} remaining
                </span>
                {summary.neededGrade !== undefined && summary.neededGrade !== null && (
                    <span style={{ fontWeight: 'bold', color: '#1F0741' }}>
                        Need: {summary.neededGrade.toFixed(1)}%
                    </span>
                )}
            </div>
        </div>
    );
}

