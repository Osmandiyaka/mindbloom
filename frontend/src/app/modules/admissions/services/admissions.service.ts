import { Injectable, signal } from '@angular/core';

export type AdmissionStatus =
    | 'inquiry'
    | 'application_submitted'
    | 'under_review'
    | 'interview_scheduled'
    | 'interview_completed'
    | 'accepted'
    | 'waitlisted'
    | 'rejected'
    | 'enrolled'
    | 'withdrawn';

export interface ScoreBreakdown {
    academic: number;
    interview: number;
    documents: number;
    other: number;
}

export interface Score {
    total: number;
    breakdown: ScoreBreakdown;
}

export interface Guardian {
    name: string;
    relationship: string;
    email: string;
    phone: string;
}

export interface Offer {
    sentAt?: Date;
    expiresAt?: Date;
    acceptedAt?: Date;
}

export interface Interview {
    scheduledAt?: Date;
    completedAt?: Date;
    notes?: string;
    interviewer?: string;
}

export interface Waitlist {
    position?: number;
    expiryDate?: Date;
}

export interface AdmissionApplication {
    id: string;
    tenantId: string;
    studentId?: string;

    // Applicant Info
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: Date;
    gender: 'male' | 'female' | 'other';
    photo?: string;

    // Application Details
    gradeLevel: string;
    previousSchool?: string;
    address: string;

    // Guardians
    guardians: Guardian[];

    // Workflow
    status: AdmissionStatus;
    statusHistory: Array<{
        status: AdmissionStatus;
        changedAt: Date;
        changedBy: string;
        notes?: string;
    }>;

    // Scoring
    score?: Score;

    // Interview
    interview?: Interview;

    // Offer
    offer?: Offer;

    // Waitlist
    waitlist?: Waitlist;

    // Documents
    documents: Array<{
        id: string;
        name: string;
        type: string;
        uploadedAt: Date;
        verified: boolean;
    }>;

    // Metadata
    priority: 'low' | 'medium' | 'high';
    notes: string;
    createdAt: Date;
    updatedAt: Date;
}

@Injectable({
    providedIn: 'root'
})
export class AdmissionsService {
    // Signal-based state management
    applications = signal<AdmissionApplication[]>(this.generateMockData());

    constructor() { }

    getApplicationsByStatus(status: AdmissionStatus): AdmissionApplication[] {
        return this.applications().filter(app => app.status === status);
    }

    getApplicationById(id: string): AdmissionApplication | undefined {
        return this.applications().find(app => app.id === id);
    }

    updateApplicationStatus(id: string, newStatus: AdmissionStatus, notes?: string): void {
        const apps = this.applications();
        const index = apps.findIndex(app => app.id === id);

        if (index !== -1) {
            const updatedApps = [...apps];
            updatedApps[index] = {
                ...updatedApps[index],
                status: newStatus,
                statusHistory: [
                    ...updatedApps[index].statusHistory,
                    {
                        status: newStatus,
                        changedAt: new Date(),
                        changedBy: 'Current User', // TODO: Get from auth
                        notes
                    }
                ],
                updatedAt: new Date()
            };

            this.applications.set(updatedApps);
        }
    }

    updateScore(id: string, score: Score): void {
        const apps = this.applications();
        const index = apps.findIndex(app => app.id === id);

        if (index !== -1) {
            const updatedApps = [...apps];
            updatedApps[index] = {
                ...updatedApps[index],
                score,
                updatedAt: new Date()
            };

            this.applications.set(updatedApps);
        }
    }

    scheduleInterview(id: string, scheduledAt: Date, notes?: string): void {
        const apps = this.applications();
        const index = apps.findIndex(app => app.id === id);

        if (index !== -1) {
            const updatedApps = [...apps];
            updatedApps[index] = {
                ...updatedApps[index],
                interview: {
                    ...updatedApps[index].interview,
                    scheduledAt,
                    notes
                },
                status: 'interview_scheduled',
                updatedAt: new Date()
            };

            this.applications.set(updatedApps);
        }
    }

    enrollStudent(id: string): void {
        // Simulate one-click enrollment
        this.updateApplicationStatus(id, 'enrolled', 'Student enrolled via one-click enrollment');
        console.log('🎓 Enrollment triggered for application:', id);
        console.log('📧 Creating student account...');
        console.log('💰 Assigning fee plans...');
        console.log('📨 Sending welcome email...');
    }

    private generateMockData(): AdmissionApplication[] {
        const baseDate = new Date('2024-01-01');

        return [
            // Inquiry Stage
            {
                id: 'adm-001',
                tenantId: 'tenant-001',
                firstName: 'Emma',
                lastName: 'Johnson',
                email: 'emma.johnson@email.com',
                phone: '+1-555-0101',
                dateOfBirth: new Date('2014-05-15'),
                gender: 'female',
                photo: 'https://i.pravatar.cc/150?img=1',
                gradeLevel: 'Grade 5',
                address: '123 Oak Street, Springfield',
                guardians: [
                    {
                        name: 'Michael Johnson',
                        relationship: 'Father',
                        email: 'michael.j@email.com',
                        phone: '+1-555-0102'
                    }
                ],
                status: 'inquiry',
                statusHistory: [
                    {
                        status: 'inquiry',
                        changedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000),
                        changedBy: 'System',
                        notes: 'Initial inquiry submitted via website'
                    }
                ],
                documents: [],
                priority: 'medium',
                notes: 'Parent inquired about STEM program',
                createdAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000)
            },

            // Application Submitted
            {
                id: 'adm-002',
                tenantId: 'tenant-001',
                firstName: 'Liam',
                lastName: 'Smith',
                email: 'liam.smith@email.com',
                phone: '+1-555-0201',
                dateOfBirth: new Date('2013-08-22'),
                gender: 'male',
                photo: 'https://i.pravatar.cc/150?img=12',
                gradeLevel: 'Grade 6',
                previousSchool: 'Lincoln Elementary',
                address: '456 Maple Ave, Springfield',
                guardians: [
                    {
                        name: 'Sarah Smith',
                        relationship: 'Mother',
                        email: 'sarah.smith@email.com',
                        phone: '+1-555-0202'
                    }
                ],
                status: 'application_submitted',
                statusHistory: [
                    {
                        status: 'inquiry',
                        changedAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000),
                        changedBy: 'System'
                    },
                    {
                        status: 'application_submitted',
                        changedAt: new Date(baseDate.getTime() + 5 * 24 * 60 * 60 * 1000),
                        changedBy: 'Sarah Smith',
                        notes: 'Application completed online'
                    }
                ],
                documents: [
                    {
                        id: 'doc-001',
                        name: 'Birth Certificate',
                        type: 'pdf',
                        uploadedAt: new Date(baseDate.getTime() + 5 * 24 * 60 * 60 * 1000),
                        verified: true
                    },
                    {
                        id: 'doc-002',
                        name: 'Previous Report Card',
                        type: 'pdf',
                        uploadedAt: new Date(baseDate.getTime() + 5 * 24 * 60 * 60 * 1000),
                        verified: false
                    }
                ],
                priority: 'high',
                notes: 'Strong academic background. Parents interested in athletics program.',
                createdAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(baseDate.getTime() + 5 * 24 * 60 * 60 * 1000)
            },

            // Under Review
            {
                id: 'adm-003',
                tenantId: 'tenant-001',
                firstName: 'Sophia',
                lastName: 'Williams',
                email: 'sophia.williams@email.com',
                phone: '+1-555-0301',
                dateOfBirth: new Date('2015-03-10'),
                gender: 'female',
                photo: 'https://i.pravatar.cc/150?img=5',
                gradeLevel: 'Grade 4',
                previousSchool: 'Washington Elementary',
                address: '789 Pine Street, Springfield',
                guardians: [
                    {
                        name: 'David Williams',
                        relationship: 'Father',
                        email: 'david.w@email.com',
                        phone: '+1-555-0302'
                    },
                    {
                        name: 'Lisa Williams',
                        relationship: 'Mother',
                        email: 'lisa.w@email.com',
                        phone: '+1-555-0303'
                    }
                ],
                status: 'under_review',
                statusHistory: [
                    {
                        status: 'inquiry',
                        changedAt: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000),
                        changedBy: 'System'
                    },
                    {
                        status: 'application_submitted',
                        changedAt: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000),
                        changedBy: 'Lisa Williams'
                    },
                    {
                        status: 'under_review',
                        changedAt: new Date(baseDate.getTime() + 10 * 24 * 60 * 60 * 1000),
                        changedBy: 'Admin User',
                        notes: 'All documents verified. Reviewing academic records.'
                    }
                ],
                score: {
                    total: 72,
                    breakdown: {
                        academic: 30, // out of 40
                        interview: 0,  // not done yet
                        documents: 18, // out of 20
                        other: 9       // out of 10
                    }
                },
                documents: [
                    {
                        id: 'doc-003',
                        name: 'Birth Certificate',
                        type: 'pdf',
                        uploadedAt: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000),
                        verified: true
                    },
                    {
                        id: 'doc-004',
                        name: 'Report Cards (2 years)',
                        type: 'pdf',
                        uploadedAt: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000),
                        verified: true
                    },
                    {
                        id: 'doc-005',
                        name: 'Immunization Records',
                        type: 'pdf',
                        uploadedAt: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000),
                        verified: true
                    }
                ],
                priority: 'high',
                notes: 'Excellent academic record. Sibling already enrolled.',
                createdAt: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(baseDate.getTime() + 10 * 24 * 60 * 60 * 1000)
            },

            // Interview Scheduled
            {
                id: 'adm-004',
                tenantId: 'tenant-001',
                firstName: 'Noah',
                lastName: 'Brown',
                email: 'noah.brown@email.com',
                phone: '+1-555-0401',
                dateOfBirth: new Date('2012-11-30'),
                gender: 'male',
                photo: 'https://i.pravatar.cc/150?img=13',
                gradeLevel: 'Grade 7',
                previousSchool: 'Jefferson Middle School',
                address: '321 Elm Street, Springfield',
                guardians: [
                    {
                        name: 'Jennifer Brown',
                        relationship: 'Mother',
                        email: 'jennifer.b@email.com',
                        phone: '+1-555-0402'
                    }
                ],
                status: 'interview_scheduled',
                statusHistory: [
                    {
                        status: 'inquiry',
                        changedAt: new Date(baseDate.getTime() + 4 * 24 * 60 * 60 * 1000),
                        changedBy: 'System'
                    },
                    {
                        status: 'application_submitted',
                        changedAt: new Date(baseDate.getTime() + 8 * 24 * 60 * 60 * 1000),
                        changedBy: 'Jennifer Brown'
                    },
                    {
                        status: 'under_review',
                        changedAt: new Date(baseDate.getTime() + 11 * 24 * 60 * 60 * 1000),
                        changedBy: 'Admin User'
                    },
                    {
                        status: 'interview_scheduled',
                        changedAt: new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000),
                        changedBy: 'Admin User',
                        notes: 'Interview scheduled with Principal'
                    }
                ],
                score: {
                    total: 65,
                    breakdown: {
                        academic: 35,
                        interview: 0,
                        documents: 20,
                        other: 10
                    }
                },
                interview: {
                    scheduledAt: new Date(baseDate.getTime() + 20 * 24 * 60 * 60 * 1000),
                    notes: 'Scheduled with Principal - Focus on leadership potential'
                },
                documents: [
                    {
                        id: 'doc-006',
                        name: 'Transcript',
                        type: 'pdf',
                        uploadedAt: new Date(baseDate.getTime() + 8 * 24 * 60 * 60 * 1000),
                        verified: true
                    }
                ],
                priority: 'medium',
                notes: 'Transferring from out of state. Strong science interest.',
                createdAt: new Date(baseDate.getTime() + 4 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000)
            },

            // Interview Completed
            {
                id: 'adm-005',
                tenantId: 'tenant-001',
                firstName: 'Olivia',
                lastName: 'Davis',
                email: 'olivia.davis@email.com',
                phone: '+1-555-0501',
                dateOfBirth: new Date('2014-07-18'),
                gender: 'female',
                photo: 'https://i.pravatar.cc/150?img=9',
                gradeLevel: 'Grade 5',
                previousSchool: 'Roosevelt Elementary',
                address: '654 Cedar Lane, Springfield',
                guardians: [
                    {
                        name: 'Robert Davis',
                        relationship: 'Father',
                        email: 'robert.d@email.com',
                        phone: '+1-555-0502'
                    }
                ],
                status: 'interview_completed',
                statusHistory: [
                    {
                        status: 'inquiry',
                        changedAt: new Date(baseDate.getTime() + 5 * 24 * 60 * 60 * 1000),
                        changedBy: 'System'
                    },
                    {
                        status: 'application_submitted',
                        changedAt: new Date(baseDate.getTime() + 9 * 24 * 60 * 60 * 1000),
                        changedBy: 'Robert Davis'
                    },
                    {
                        status: 'under_review',
                        changedAt: new Date(baseDate.getTime() + 12 * 24 * 60 * 60 * 1000),
                        changedBy: 'Admin User'
                    },
                    {
                        status: 'interview_scheduled',
                        changedAt: new Date(baseDate.getTime() + 15 * 24 * 60 * 60 * 1000),
                        changedBy: 'Admin User'
                    },
                    {
                        status: 'interview_completed',
                        changedAt: new Date(baseDate.getTime() + 21 * 24 * 60 * 60 * 1000),
                        changedBy: 'Principal',
                        notes: 'Interview completed successfully'
                    }
                ],
                score: {
                    total: 88,
                    breakdown: {
                        academic: 38,
                        interview: 28,
                        documents: 18,
                        other: 10
                    }
                },
                interview: {
                    scheduledAt: new Date(baseDate.getTime() + 21 * 24 * 60 * 60 * 1000),
                    completedAt: new Date(baseDate.getTime() + 21 * 24 * 60 * 60 * 1000),
                    notes: 'Excellent communication skills. Strong motivation. Good fit for our program.',
                    interviewer: 'Dr. Sarah Martinez, Principal'
                },
                documents: [
                    {
                        id: 'doc-007',
                        name: 'Birth Certificate',
                        type: 'pdf',
                        uploadedAt: new Date(baseDate.getTime() + 9 * 24 * 60 * 60 * 1000),
                        verified: true
                    },
                    {
                        id: 'doc-008',
                        name: 'Medical Records',
                        type: 'pdf',
                        uploadedAt: new Date(baseDate.getTime() + 9 * 24 * 60 * 60 * 1000),
                        verified: true
                    }
                ],
                priority: 'high',
                notes: 'Top candidate. Recommended for acceptance.',
                createdAt: new Date(baseDate.getTime() + 5 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(baseDate.getTime() + 21 * 24 * 60 * 60 * 1000)
            },

            // Accepted
            {
                id: 'adm-006',
                tenantId: 'tenant-001',
                firstName: 'Ethan',
                lastName: 'Martinez',
                email: 'ethan.martinez@email.com',
                phone: '+1-555-0601',
                dateOfBirth: new Date('2013-09-25'),
                gender: 'male',
                photo: 'https://i.pravatar.cc/150?img=14',
                gradeLevel: 'Grade 6',
                previousSchool: 'Kennedy Elementary',
                address: '987 Birch Road, Springfield',
                guardians: [
                    {
                        name: 'Carlos Martinez',
                        relationship: 'Father',
                        email: 'carlos.m@email.com',
                        phone: '+1-555-0602'
                    },
                    {
                        name: 'Maria Martinez',
                        relationship: 'Mother',
                        email: 'maria.m@email.com',
                        phone: '+1-555-0603'
                    }
                ],
                status: 'accepted',
                statusHistory: [
                    {
                        status: 'inquiry',
                        changedAt: new Date(baseDate.getTime() + 6 * 24 * 60 * 60 * 1000),
                        changedBy: 'System'
                    },
                    {
                        status: 'application_submitted',
                        changedAt: new Date(baseDate.getTime() + 10 * 24 * 60 * 60 * 1000),
                        changedBy: 'Maria Martinez'
                    },
                    {
                        status: 'under_review',
                        changedAt: new Date(baseDate.getTime() + 13 * 24 * 60 * 60 * 1000),
                        changedBy: 'Admin User'
                    },
                    {
                        status: 'interview_completed',
                        changedAt: new Date(baseDate.getTime() + 22 * 24 * 60 * 60 * 1000),
                        changedBy: 'Admin User'
                    },
                    {
                        status: 'accepted',
                        changedAt: new Date(baseDate.getTime() + 25 * 24 * 60 * 60 * 1000),
                        changedBy: 'Admissions Committee',
                        notes: 'Application approved. Offer letter sent.'
                    }
                ],
                score: {
                    total: 92,
                    breakdown: {
                        academic: 40,
                        interview: 30,
                        documents: 20,
                        other: 10
                    }
                },
                offer: {
                    sentAt: new Date(baseDate.getTime() + 25 * 24 * 60 * 60 * 1000),
                    expiresAt: new Date(baseDate.getTime() + 40 * 24 * 60 * 60 * 1000)
                },
                documents: [
                    {
                        id: 'doc-009',
                        name: 'Full Application Package',
                        type: 'pdf',
                        uploadedAt: new Date(baseDate.getTime() + 10 * 24 * 60 * 60 * 1000),
                        verified: true
                    }
                ],
                priority: 'high',
                notes: 'Outstanding candidate. Honor roll student. Bilingual.',
                createdAt: new Date(baseDate.getTime() + 6 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(baseDate.getTime() + 25 * 24 * 60 * 60 * 1000)
            },

            // Waitlisted
            {
                id: 'adm-007',
                tenantId: 'tenant-001',
                firstName: 'Ava',
                lastName: 'Garcia',
                email: 'ava.garcia@email.com',
                phone: '+1-555-0701',
                dateOfBirth: new Date('2015-02-14'),
                gender: 'female',
                photo: 'https://i.pravatar.cc/150?img=10',
                gradeLevel: 'Grade 4',
                address: '147 Spruce Court, Springfield',
                guardians: [
                    {
                        name: 'Elena Garcia',
                        relationship: 'Mother',
                        email: 'elena.g@email.com',
                        phone: '+1-555-0702'
                    }
                ],
                status: 'waitlisted',
                statusHistory: [
                    {
                        status: 'inquiry',
                        changedAt: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000),
                        changedBy: 'System'
                    },
                    {
                        status: 'application_submitted',
                        changedAt: new Date(baseDate.getTime() + 11 * 24 * 60 * 60 * 1000),
                        changedBy: 'Elena Garcia'
                    },
                    {
                        status: 'under_review',
                        changedAt: new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000),
                        changedBy: 'Admin User'
                    },
                    {
                        status: 'waitlisted',
                        changedAt: new Date(baseDate.getTime() + 26 * 24 * 60 * 60 * 1000),
                        changedBy: 'Admissions Committee',
                        notes: 'Grade 4 class is full. Added to waitlist position 3.'
                    }
                ],
                score: {
                    total: 78,
                    breakdown: {
                        academic: 32,
                        interview: 24,
                        documents: 18,
                        other: 9
                    }
                },
                waitlist: {
                    position: 3,
                    expiryDate: new Date(baseDate.getTime() + 90 * 24 * 60 * 60 * 1000)
                },
                documents: [
                    {
                        id: 'doc-010',
                        name: 'Application Documents',
                        type: 'pdf',
                        uploadedAt: new Date(baseDate.getTime() + 11 * 24 * 60 * 60 * 1000),
                        verified: true
                    }
                ],
                priority: 'medium',
                notes: 'Strong candidate. Will be notified if spot opens.',
                createdAt: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(baseDate.getTime() + 26 * 24 * 60 * 60 * 1000)
            },

            // Enrolled
            {
                id: 'adm-008',
                tenantId: 'tenant-001',
                firstName: 'Isabella',
                lastName: 'Rodriguez',
                email: 'isabella.rodriguez@email.com',
                phone: '+1-555-0801',
                dateOfBirth: new Date('2012-12-05'),
                gender: 'female',
                photo: 'https://i.pravatar.cc/150?img=44',
                gradeLevel: 'Grade 7',
                previousSchool: 'Madison Middle School',
                address: '258 Willow Way, Springfield',
                guardians: [
                    {
                        name: 'Diego Rodriguez',
                        relationship: 'Father',
                        email: 'diego.r@email.com',
                        phone: '+1-555-0802'
                    }
                ],
                status: 'enrolled',
                statusHistory: [
                    {
                        status: 'inquiry',
                        changedAt: new Date(baseDate.getTime() + 8 * 24 * 60 * 60 * 1000),
                        changedBy: 'System'
                    },
                    {
                        status: 'application_submitted',
                        changedAt: new Date(baseDate.getTime() + 12 * 24 * 60 * 60 * 1000),
                        changedBy: 'Diego Rodriguez'
                    },
                    {
                        status: 'accepted',
                        changedAt: new Date(baseDate.getTime() + 27 * 24 * 60 * 60 * 1000),
                        changedBy: 'Admin User',
                        notes: 'Fast-track approval for sibling enrollment'
                    },
                    {
                        status: 'enrolled',
                        changedAt: new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000),
                        changedBy: 'Admin User',
                        notes: 'One-click enrollment completed. Student account created.'
                    }
                ],
                studentId: 'std-001',
                score: {
                    total: 95,
                    breakdown: {
                        academic: 40,
                        interview: 30,
                        documents: 20,
                        other: 10
                    }
                },
                offer: {
                    sentAt: new Date(baseDate.getTime() + 27 * 24 * 60 * 60 * 1000),
                    acceptedAt: new Date(baseDate.getTime() + 29 * 24 * 60 * 60 * 1000)
                },
                documents: [
                    {
                        id: 'doc-011',
                        name: 'Complete Records',
                        type: 'pdf',
                        uploadedAt: new Date(baseDate.getTime() + 12 * 24 * 60 * 60 * 1000),
                        verified: true
                    }
                ],
                priority: 'high',
                notes: 'Sibling of current student. Enrollment complete. Fee plans assigned.',
                createdAt: new Date(baseDate.getTime() + 8 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000)
            }
        ];
    }
}
