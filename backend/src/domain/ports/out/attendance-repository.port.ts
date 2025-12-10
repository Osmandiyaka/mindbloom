import { AttendanceRecord, AttendanceRecordProps, AttendanceStatus } from '../../attendance/entities/attendance-record.entity';

export interface AttendanceFilters {
  studentId?: string;
  class?: string;
  section?: string;
  status?: AttendanceStatus;
  dateFrom?: Date;
  dateTo?: Date;
}

export const ATTENDANCE_REPOSITORY = 'ATTENDANCE_REPOSITORY';

export interface IAttendanceRepository {
  create(record: AttendanceRecord): Promise<AttendanceRecord>;
  findById(id: string, tenantId: string): Promise<AttendanceRecord | null>;
  findAll(tenantId: string, filters?: AttendanceFilters): Promise<AttendanceRecord[]>;
  update(record: AttendanceRecord): Promise<AttendanceRecord>;
  delete(id: string, tenantId: string): Promise<void>;
}
