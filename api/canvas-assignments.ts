import type { NextApiRequest, NextApiResponse } from './next-types';

function validateCanvasUrl(domain: string): string {
    // Remove any protocol if present
    let cleanDomain = domain.replace(/^https?:\/\//, '');
    // Remove any trailing slashes
    cleanDomain = cleanDomain.replace(/\/+$/, '');
    // Ensure the domain looks valid
    if (!cleanDomain.includes('.')) {
        throw new Error('Invalid Canvas domain format');
    }
    return cleanDomain;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { token, domain, courseId } = req.body;

    try {
        // Validate inputs
        if (!token) {
            return res.status(400).json({
                error: 'Missing token',
                details: 'Canvas API token is required'
            });
        }

        if (!domain) {
            return res.status(400).json({
                error: 'Missing domain',
                details: 'Canvas domain is required'
            });
        }

        if (!courseId) {
            return res.status(400).json({
                error: 'Missing courseId',
                details: 'Course ID is required'
            });
        }

        // Validate and clean the domain
        const cleanDomain = validateCanvasUrl(domain);
        console.log('Using Canvas domain:', cleanDomain);

        // Test the Canvas API connection first
        const testResponse = await fetch(`https://${cleanDomain}/api/v1/courses/${courseId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!testResponse.ok) {
            const errorText = await testResponse.text();
            console.error('Canvas API Connection Test Failed:', {
                status: testResponse.status,
                statusText: testResponse.statusText,
                error: errorText
            });

            // Handle specific error cases
            if (testResponse.status === 401) {
                return res.status(401).json({
                    error: 'Invalid Canvas token',
                    details: 'Please check your Canvas API token'
                });
            }
            if (testResponse.status === 404) {
                return res.status(404).json({
                    error: 'Course not found',
                    details: `Course ${courseId} not found or you don't have access to it`
                });
            }
            throw new Error(`Canvas API test failed: ${testResponse.status} ${testResponse.statusText}`);
        }

        // Fetch assignment groups
        const groupsUrl = `https://${cleanDomain}/api/v1/courses/${courseId}/assignment_groups?include[]=assignments&include[]=submission&per_page=100`;
        console.log('Fetching groups from:', groupsUrl);

        const groupsResponse = await fetch(groupsUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!groupsResponse.ok) {
            const errorText = await groupsResponse.text();
            console.error('Canvas API Error (Groups):', {
                status: groupsResponse.status,
                statusText: groupsResponse.statusText,
                error: errorText
            });
            throw new Error(`Failed to fetch assignment groups: ${groupsResponse.status} ${groupsResponse.statusText}`);
        }

        let groups;
        try {
            groups = await groupsResponse.json();
            console.log('Successfully fetched groups:', {
                count: groups.length,
                firstGroup: groups[0]?.name
            });
        } catch (error) {
            console.error('Error parsing groups response:', error);
            throw new Error('Invalid response format from Canvas API (Groups)');
        }

        if (!Array.isArray(groups)) {
            console.error('Unexpected groups response:', groups);
            throw new Error('Invalid groups data from Canvas API');
        }

        // Fetch assignments
        const assignmentsUrl = `https://${cleanDomain}/api/v1/courses/${courseId}/assignments?include[]=submission&include[]=score&include[]=grades&per_page=100`;
        console.log('Fetching assignments from:', assignmentsUrl);

        const assignmentsResponse = await fetch(assignmentsUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!assignmentsResponse.ok) {
            const errorText = await assignmentsResponse.text();
            console.error('Canvas API Error (Assignments):', {
                status: assignmentsResponse.status,
                statusText: assignmentsResponse.statusText,
                error: errorText
            });
            throw new Error(`Failed to fetch assignments: ${assignmentsResponse.status} ${assignmentsResponse.statusText}`);
        }

        let assignments;
        try {
            assignments = await assignmentsResponse.json();
            console.log('Successfully fetched assignments:', {
                count: assignments.length,
                firstAssignment: assignments[0]?.name
            });
        } catch (error) {
            console.error('Error parsing assignments response:', error);
            throw new Error('Invalid response format from Canvas API (Assignments)');
        }

        if (!Array.isArray(assignments)) {
            console.error('Unexpected assignments response:', assignments);
            throw new Error('Invalid assignments data from Canvas API');
        }

        // Process assignments and groups
        const assignmentsWithGroups = assignments.map((assignment: any) => {
            const group = groups.find((g: any) => g.id === assignment.assignment_group_id);
            return {
                id: assignment.id.toString(),
                name: assignment.name || 'Unnamed Assignment',
                points: assignment.submission?.score || 0,
                totalPoints: assignment.points_possible || 0,
                dueDate: assignment.due_at,
                isCompleted: assignment.submission?.workflow_state === 'graded',
                canvasGrade: assignment.submission?.score !== null && assignment.points_possible
                    ? (assignment.submission.score / assignment.points_possible) * 100
                    : undefined,
                groupName: group?.name || 'Uncategorized',
                groupWeight: group?.group_weight || 0,
                weight: (group?.group_weight || 0) / (group?.assignments?.length || 1)
            };
        });

        const groupedAssignments = groups.map((group: any) => ({
            id: group.id.toString(),
            name: group.name || 'Unnamed Group',
            weight: group.group_weight || 0,
            assignments: assignmentsWithGroups.filter(
                (a: any) => a.groupName === group.name
            )
        }));

        console.log('Successfully processed Canvas data:', {
            assignmentsCount: assignmentsWithGroups.length,
            groupsCount: groupedAssignments.length,
            sampleAssignment: assignmentsWithGroups[0]?.name,
            sampleGroup: groupedAssignments[0]?.name
        });

        return res.status(200).json({
            assignments: assignmentsWithGroups,
            groups: groupedAssignments
        });
    } catch (error) {
        console.error('Error in Canvas API handler:', error);
        return res.status(500).json({
            error: 'Server error while contacting Canvas',
            details: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
} 