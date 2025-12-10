import { AttendanceStatus } from '../../../../domain/attendance/entities/attendance-record.entity';

export interface UpdateAttendanceCommand {
  tenantId: string;
  id: string;
  status: AttendanceStatus;
  reason?: string;
}
