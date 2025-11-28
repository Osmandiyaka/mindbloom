import { StudentStatus } from '../../../../domain/student/entities/student.entity';

export interface UpdateStudentCommand {
    tenantId: string;
    id: string;
    firstName?: string;
    lastName?: string;
    middleName?: string;
    email?: string;
    phone?: string;
    address?: {
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };
    nationality?: string;
    religion?: string;
    caste?: string;
    motherTongue?: string;
    status?: StudentStatus;
    photo?: string;
    notes?: string;
}
