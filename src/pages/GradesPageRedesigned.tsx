import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { getUserSettings } from '../utils/firestoreUser';
import { loadAllGradeConfigs, createDefaultConfig, saveGradeConfig } from '../utils/gradeConfigStorage';
import { generateGradeSummary } from '../utils/gradeCalculationsHybrid';
import { CourseGradeConfig, CourseGradeSummary, AssignmentWithCategory } from '../types/courseGradeConfig';
import CourseGradeCard from '../components/CourseGradeCard';
import CourseDetailView from '../components/CourseDetailView';

function GradesPageRedesigned() {
    const [courses, setCourses] = useState<CourseGradeSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
    const [configs, setConfigs] = useState<Map<string, CourseGradeConfig>>(new Map());

    // Fetch courses from Canvas and load configurations
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                const user = auth.currentUser;
                if (!user) {
                    setError('Please sign in to view grades');
                    setLoading(false);
                    return;
                }

                const settings = await getUserSettings(user.uid);
                if (!settings?.token || !settings?.domain) {
                    setError('Please configure your Canvas settings in Account page');
                    setLoading(false);
                    return;
                }

                // Load all grade configs
                const savedConfigs = await loadAllGradeConfigs(user.uid);
                const configsMap = new Map<string, CourseGradeConfig>();
                savedConfigs.forEach(config => {
                    configsMap.set(config.courseId, config);
                });
                setConfigs(configsMap);

                // Fetch courses from Canvas
                const cleanDomain = settings.domain.replace(/^https?:\/\//, '');
                const coursesRes = await fetch('/api/canvas-courses', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        token: settings.token,
                        domain: `https://${cleanDomain}`
                    })
                });

                if (!coursesRes.ok) {
                    throw new Error('Failed to fetch courses from Canvas');
                }

                const canvasCourses = await coursesRes.json();

                // Process each course
                const courseSummaries: CourseGradeSummary[] = [];

                for (const course of canvasCourses) {
                    const courseId = course.id.toString();
                    const courseName = course.name || 'Unnamed Course';

                    // Get or create config
                    let config = configsMap.get(courseId);
                    if (!config) {
                        // Create default config
                        config = createDefaultConfig(courseId, courseName, courseId);
                        // Save it
                        await saveGradeConfig(user.uid, config);
                        configsMap.set(courseId, config);
                    }

                    // Fetch assignments for this course
                    try {
                        const assignmentsRes = await fetch('/api/canvas-assignments', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                token: settings.token,
                                domain: cleanDomain,
                                courseId: courseId
                            })
                        });

                        if (assignmentsRes.ok) {
                            const assignmentsData = await assignmentsRes.json();

                            // Map Canvas assignments to AssignmentWithCategory
                            const canvasAssignments: AssignmentWithCategory[] = (assignmentsData.assignments || []).map((a: any) => {
                                // Find category for this assignment group
                                const category = config!.categories.find(
                                    cat => cat.name === a.groupName || cat.id.includes(a.groupName || '')
                                ) || config!.categories[0]; // Default to first category

                                return {
                                    id: a.id.toString(),
                                    name: a.name,
                                    pointsEarned: a.points || 0,
                                    pointsPossible: a.totalPoints || 0,
                                    percentage: a.totalPoints > 0 ? (a.points / a.totalPoints) * 100 : 0,
                                    categoryId: category.id,
                                    categoryName: category.name,
                                    dueDate: a.dueDate,
                                    completed: a.isCompleted || false,
                                    source: 'canvas' as const,
                                    canvasId: a.id.toString()
                                };
                            });

                            // Generate summary
                            const summary = generateGradeSummary(
                                config,
                                canvasAssignments,
                                config.manualAssignments
                            );

                            courseSummaries.push(summary);
                        }
                    } catch (err) {
                        console.error(`Error fetching assignments for course ${courseId}:`, err);
                        // Still create a summary with no assignments
                        const summary = generateGradeSummary(config, [], config.manualAssignments);
                        courseSummaries.push(summary);
                    }
                }

                setCourses(courseSummaries);
                setConfigs(configsMap);
            } catch (err) {
                console.error('Error fetching grades:', err);
                setError(err instanceof Error ? err.message : 'Failed to load grades');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleCourseClick = (courseId: string) => {
        setSelectedCourseId(courseId);
    };

    const handleBackToList = () => {
        setSelectedCourseId(null);
    };

    const handleConfigUpdate = async (updatedConfig: CourseGradeConfig) => {
        const user = auth.currentUser;
        if (!user) return;

        await saveGradeConfig(user.uid, updatedConfig);
        const newConfigs = new Map(configs);
        newConfigs.set(updatedConfig.courseId, updatedConfig);
        setConfigs(newConfigs);

        // Regenerate summary for this course
        const course = courses.find(c => c.courseId === updatedConfig.courseId);
        if (course) {
            // This would need to be refetched, but for now just update the config
            // In a full implementation, you'd want to refetch assignments and recalculate
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', color: '#1F0741' }}>Loading grades...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '2rem' }}>
                <div style={{
                    padding: '1rem',
                    backgroundColor: '#ffebee',
                    border: '2px solid #F44336',
                    borderRadius: '8px',
                    color: '#C62828'
                }}>
                    <strong>Error:</strong> {error}
                </div>
            </div>
        );
    }

    // Show course detail view if a course is selected
    if (selectedCourseId) {
        const config = configs.get(selectedCourseId);
        const course = courses.find(c => c.courseId === selectedCourseId);

        if (!config || !course) {
            return (
                <div style={{ padding: '2rem' }}>
                    <button
                        onClick={handleBackToList}
                        style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#1F0741',
                            color: '#FFFBF1',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            marginBottom: '1rem'
                        }}
                    >
                        ← Back to Courses
                    </button>
                    <div>Course not found</div>
                </div>
            );
        }

        return (
            <CourseDetailView
                config={config}
                summary={course}
                onBack={handleBackToList}
                onConfigUpdate={handleConfigUpdate}
            />
        );
    }

    // Show course list
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
                marginBottom: '1.5rem'
            }}>
                <h2 style={{
                    fontSize: '42px',
                    fontWeight: '900',
                    color: '#1f0741',
                    margin: 0
                }}>
                    Grades
                </h2>
                <button
                    onClick={() => window.location.reload()}
                    style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#ffb703',
                        color: '#1F0741',
                        border: '2px solid #1F0741',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '14px'
                    }}
                >
                    🔄 Sync Canvas
                </button>
            </div>

            {/* Course grid */}
            {courses.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '3rem',
                    backgroundColor: '#FFFBF1',
                    borderRadius: '16px',
                    border: '3px solid #1F0741'
                }}>
                    <h3 style={{ color: '#1F0741', marginBottom: '1rem' }}>
                        No courses found
                    </h3>
                    <p style={{ color: '#666' }}>
                        Make sure your Canvas account is connected and you have active courses.
                    </p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                    gap: '1.5rem',
                    overflowY: 'auto',
                    flex: 1,
                    paddingBottom: '1rem'
                }}>
                    {courses.map(course => (
                        <CourseGradeCard
                            key={course.courseId}
                            summary={course}
                            onClick={() => handleCourseClick(course.courseId)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default GradesPageRedesigned;

