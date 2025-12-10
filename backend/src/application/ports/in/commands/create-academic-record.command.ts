export interface CreateAcademicRecordCommand {
  tenantId: string;
  studentId: string;
  subject: string;
  exam: string;
  term?: string;
  academicYear?: string;
  class?: string;
  section?: string;
  score?: number;
  grade?: string;
  remarks?: string;
  recordedAt: Date;
  recordedBy: string;
}
