import { AcademicRecord } from '../../academics/entities/academic-record.entity';

export interface AcademicRecordFilters {
  studentId?: string;
  subject?: string;
  exam?: string;
  term?: string;
  academicYear?: string;
}

export const ACADEMIC_RECORD_REPOSITORY = 'ACADEMIC_RECORD_REPOSITORY';

export interface IAcademicRecordRepository {
  create(record: AcademicRecord): Promise<AcademicRecord>;
  findById(id: string, tenantId: string): Promise<AcademicRecord | null>;
  findAll(tenantId: string, filters?: AcademicRecordFilters): Promise<AcademicRecord[]>;
  update(record: AcademicRecord): Promise<AcademicRecord>;
  delete(id: string, tenantId: string): Promise<void>;
}
