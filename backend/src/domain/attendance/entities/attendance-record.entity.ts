export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceRecordProps {
  id: string;
  tenantId: string;
  studentId: string;
  class?: string;
  section?: string;
  date: Date; // normalized to day (UTC midnight recommended)
  status: AttendanceStatus;
  reason?: string;
  recordedBy: string; // staffId
  recordedAt: Date;
}

export class AttendanceRecord {
  private props: AttendanceRecordProps;

  constructor(props: AttendanceRecordProps) {
    this.props = props;
    this.validate();
  }

  private validate() {
    if (!this.props.id) throw new Error('Attendance id is required');
    if (!this.props.tenantId) throw new Error('Tenant id is required');
    if (!this.props.studentId) throw new Error('Student id is required');
    if (!this.props.date) throw new Error('Date is required');
    if (!this.props.status) throw new Error('Status is required');
    if (!this.props.recordedBy) throw new Error('RecordedBy is required');
    if (!this.props.recordedAt) throw new Error('RecordedAt is required');
  }

  get id() { return this.props.id; }
  get tenantId() { return this.props.tenantId; }
  get studentId() { return this.props.studentId; }
  get class() { return this.props.class; }
  get section() { return this.props.section; }
  get date() { return this.props.date; }
  get status() { return this.props.status; }
  get reason() { return this.props.reason; }
  get recordedBy() { return this.props.recordedBy; }
  get recordedAt() { return this.props.recordedAt; }

  changeStatus(status: AttendanceStatus, reason?: string) {
    this.props.status = status;
    this.props.reason = reason;
  }

  toJSON(): AttendanceRecordProps {
    return { ...this.props };
  }
}
