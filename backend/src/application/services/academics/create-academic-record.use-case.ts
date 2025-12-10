import { Inject, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { AcademicRecord, AcademicRecordProps } from '../../../domain/academics/entities/academic-record.entity';
import { ACADEMIC_RECORD_REPOSITORY, IAcademicRecordRepository } from '../../../domain/ports/out/academic-record-repository.port';
import { CreateAcademicRecordCommand } from '../../ports/in/commands/create-academic-record.command';

@Injectable()
export class CreateAcademicRecordUseCase {
  constructor(
    @Inject(ACADEMIC_RECORD_REPOSITORY)
    private readonly repo: IAcademicRecordRepository,
  ) {}

  async execute(command: CreateAcademicRecordCommand): Promise<AcademicRecord> {
    const id = new Types.ObjectId().toString();
    const now = new Date();
    const props: AcademicRecordProps = {
      id,
      tenantId: command.tenantId,
      studentId: command.studentId,
      subject: command.subject,
      exam: command.exam,
      term: command.term,
      academicYear: command.academicYear,
      class: command.class,
      section: command.section,
      score: command.score,
      grade: command.grade,
      remarks: command.remarks,
      recordedAt: command.recordedAt || now,
      recordedBy: command.recordedBy,
      createdAt: now,
      updatedAt: now,
    };
    const record = new AcademicRecord(props);
    return this.repo.create(record);
  }
}
