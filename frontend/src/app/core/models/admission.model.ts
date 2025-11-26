export type ApplicationStatus = 'review' | 'rejected' | 'enrolled';

export interface AdmissionApplication {
    id: string;
    applicantName: string;
    gradeApplying: string;
    email: string;
    phone: string;
    status: ApplicationStatus;
    submittedAt: Date;
    updatedAt: Date;
    notes?: string;
    documents: {
        name: string;
        type: string;
        url?: string;
    }[];
}
