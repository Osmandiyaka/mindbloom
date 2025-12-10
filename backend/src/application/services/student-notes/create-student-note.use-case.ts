import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { StudentNote, StudentNoteProps } from '../../../domain/student/entities/student-note.entity';
import { IStudentNoteRepository, STUDENT_NOTE_REPOSITORY } from '../../../domain/ports/out/student-note-repository.port';
import { CreateStudentNoteCommand } from '../../ports/in/commands/create-student-note.command';

@Injectable()
export class CreateStudentNoteUseCase {
  constructor(
    @Inject(STUDENT_NOTE_REPOSITORY)
    private readonly repository: IStudentNoteRepository,
  ) {}

  async execute(cmd: CreateStudentNoteCommand): Promise<StudentNote> {
    const noteProps: StudentNoteProps = {
      id: randomUUID(),
      studentId: cmd.studentId,
      tenantId: cmd.tenantId,
      staffId: cmd.staffId,
      category: cmd.category,
      content: cmd.content.trim(),
      createdAt: new Date(),
    };

    const note = new StudentNote(noteProps);
    return this.repository.create(note);
  }
}
