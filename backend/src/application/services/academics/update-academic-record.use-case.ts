import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AcademicRecord } from '../../../domain/academics/entities/academic-record.entity';
import { ACADEMIC_RECORD_REPOSITORY, IAcademicRecordRepository } from '../../../domain/ports/out/academic-record-repository.port';
import { UpdateAcademicRecordCommand } from '../../ports/in/commands/update-academic-record.command';

@Injectable()
export class UpdateAcademicRecordUseCase {
  constructor(
    @Inject(ACADEMIC_RECORD_REPOSITORY)
    private readonly repo: IAcademicRecordRepository,
  ) {}

  async execute(command: UpdateAcademicRecordCommand): Promise<AcademicRecord> {
    const existing = await this.repo.findById(command.id, command.tenantId);
    if (!existing) {
      throw new NotFoundException('Academic record not found');
    }
    existing.update(command.score, command.grade, command.remarks);
    return this.repo.update(existing);
  }
}
