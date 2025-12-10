export interface UpdateAcademicRecordCommand {
  tenantId: string;
  id: string;
  score?: number;
  grade?: string;
  remarks?: string;
}
