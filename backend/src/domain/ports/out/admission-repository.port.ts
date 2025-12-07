import { Admission, ApplicationStatus } from '../../admission/entities/admission.entity';

export interface AdmissionFilters {
    search?: string; // Search by name, email, application number
    status?: ApplicationStatus;
    statuses?: ApplicationStatus[];
    gradeApplying?: string;
    academicYear?: string;
    source?: string;
    dateFrom?: Date;
    dateTo?: Date;
}

export interface IAdmissionRepository {
    create(admission: Admission): Promise<Admission>;
    findById(id: string, tenantId: string): Promise<Admission | null>;
    findByEmail(email: string, tenantId: string): Promise<Admission | null>;
    findByApplicationNumber(applicationNumber: string, tenantId: string): Promise<Admission | null>;
    findAll(tenantId: string, filters?: AdmissionFilters): Promise<Admission[]>;
    update(admission: Admission): Promise<Admission>;
    updateStatus(id: string, tenantId: string, status: ApplicationStatus, changedBy: string, note?: string): Promise<Admission>;
    delete(id: string, tenantId: string): Promise<void>;
    count(tenantId: string, filters?: AdmissionFilters): Promise<number>;
    countByStatus(tenantId: string): Promise<Record<ApplicationStatus, number>>;
}

export { ADMISSION_REPOSITORY } from './repository.tokens';
