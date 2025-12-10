export interface AcademicRecordProps {
  id: string;
  tenantId: string;
  studentId: string;
  subject: string;
  exam: string; // e.g. "Midterm", "Final"
  term?: string;
  academicYear?: string;
  class?: string;
  section?: string;
  score?: number;
  grade?: string;
  remarks?: string;
  recordedAt: Date;
  recordedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class AcademicRecord {
  private props: AcademicRecordProps;

  constructor(props: AcademicRecordProps) {
    this.props = props;
    this.validate();
  }

  private validate() {
    if (!this.props.id) throw new Error('Academic record id is required');
    if (!this.props.tenantId) throw new Error('Tenant id is required');
    if (!this.props.studentId) throw new Error('Student id is required');
    if (!this.props.subject) throw new Error('Subject is required');
    if (!this.props.exam) throw new Error('Exam is required');
    if (!this.props.recordedBy) throw new Error('RecordedBy is required');
    if (!this.props.recordedAt) throw new Error('RecordedAt is required');
  }

  get id() { return this.props.id; }
  get tenantId() { return this.props.tenantId; }
  get studentId() { return this.props.studentId; }
  get subject() { return this.props.subject; }
  get exam() { return this.props.exam; }
  get term() { return this.props.term; }
  get academicYear() { return this.props.academicYear; }
  get class() { return this.props.class; }
  get section() { return this.props.section; }
  get score() { return this.props.score; }
  get grade() { return this.props.grade; }
  get remarks() { return this.props.remarks; }
  get recordedAt() { return this.props.recordedAt; }
  get recordedBy() { return this.props.recordedBy; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }

  update(score?: number, grade?: string, remarks?: string) {
    if (score !== undefined) this.props.score = score;
    if (grade !== undefined) this.props.grade = grade;
    if (remarks !== undefined) this.props.remarks = remarks;
    this.props.updatedAt = new Date();
  }

  toJSON(): AcademicRecordProps {
    return { ...this.props };
  }
}
