export interface UpdateEnrollmentCommand {
    studentId: string;
    tenantId: string;
    class?: string;
    section?: string;
    academicYear?: string;
    admissionNumber?: string;
    admissionDate?: Date;
    status?: string;
}
