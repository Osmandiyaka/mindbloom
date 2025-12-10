import { Inject, Injectable } from '@nestjs/common';
import { AcademicRecord } from '../../../domain/academics/entities/academic-record.entity';
import { ACADEMIC_RECORD_REPOSITORY, AcademicRecordFilters, IAcademicRecordRepository } from '../../../domain/ports/out/academic-record-repository.port';

@Injectable()
export class ListAcademicRecordsUseCase {
  constructor(
    @Inject(ACADEMIC_RECORD_REPOSITORY)
    private readonly repo: IAcademicRecordRepository,
  ) {}

  async execute(tenantId: string, filters: AcademicRecordFilters = {}): Promise<AcademicRecord[]> {
    return this.repo.findAll(tenantId, filters);
  }
}
