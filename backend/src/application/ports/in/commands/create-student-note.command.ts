import { StudentNoteCategory } from '../../../../domain/student/entities/student-note.entity';

export interface CreateStudentNoteCommand {
  tenantId: string;
  studentId: string;
  staffId: string;
  category: StudentNoteCategory;
  content: string;
}
