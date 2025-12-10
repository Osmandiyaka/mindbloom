export type StudentNoteCategory = 'general' | 'conduct' | 'academic';

export interface StudentNoteProps {
  id: string;
  studentId: string;
  tenantId: string;
  staffId: string;
  category: StudentNoteCategory;
  content: string;
  createdAt: Date;
}

export class StudentNote {
  private props: StudentNoteProps;

  constructor(props: StudentNoteProps) {
    this.props = props;
    this.validate();
  }

  private validate() {
    if (!this.props.id) throw new Error('Note ID is required');
    if (!this.props.studentId) throw new Error('Student ID is required');
    if (!this.props.tenantId) throw new Error('Tenant ID is required');
    if (!this.props.staffId) throw new Error('Staff ID is required');
    if (!this.props.category) throw new Error('Category is required');
    if (!this.props.content?.trim()) throw new Error('Content is required');
  }

  get id() { return this.props.id; }
  get studentId() { return this.props.studentId; }
  get tenantId() { return this.props.tenantId; }
  get staffId() { return this.props.staffId; }
  get category() { return this.props.category; }
  get content() { return this.props.content; }
  get createdAt() { return this.props.createdAt; }

  toJSON(): StudentNoteProps {
    return { ...this.props };
  }
}
