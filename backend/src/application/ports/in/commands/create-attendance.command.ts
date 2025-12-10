import { AttendanceStatus } from '../../../../domain/attendance/entities/attendance-record.entity';

export interface CreateAttendanceCommand {
  tenantId: string;
  studentId: string;
  class?: string;
  section?: string;
  date: Date;
  status: AttendanceStatus;
  reason?: string;
  recordedBy: string; // staffId
}
