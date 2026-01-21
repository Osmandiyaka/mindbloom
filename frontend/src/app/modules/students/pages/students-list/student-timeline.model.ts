export type StudentTimelineCategory = 'enrollment' | 'documents' | 'guardians' | 'system' | 'notes';

export interface TimelineActor {
    id?: string;
    name: string;
}

export interface StudentTimelineItem {
    id: string;
    studentId: string;
    category: StudentTimelineCategory;
    title: string;
    description?: string;
    occurredAt: string;
    actor?: TimelineActor;
    metadata?: Record<string, string>;
    links?: Array<{ label: string; route: string }>;
}

export type TimelineFilter = StudentTimelineCategory | 'all';
