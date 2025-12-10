import { Inject, Injectable } from '@nestjs/common';
import { IStudentNoteRepository, STUDENT_NOTE_REPOSITORY, StudentNoteFilters } from '../../../domain/ports/out/student-note-repository.port';
import { StudentNote } from '../../../domain/student/entities/student-note.entity';

@Injectable()
export class GetStudentNotesUseCase {
  constructor(
    @Inject(STUDENT_NOTE_REPOSITORY)
    private readonly repository: IStudentNoteRepository,
  ) {}

  async execute(tenantId: string, filters: StudentNoteFilters): Promise<StudentNote[]> {
    return this.repository.findAll(tenantId, filters);
  }
}
