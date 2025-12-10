import { Inject, Injectable } from '@nestjs/common';
import { ACADEMIC_RECORD_REPOSITORY, IAcademicRecordRepository } from '../../../domain/ports/out/academic-record-repository.port';

@Injectable()
export class DeleteAcademicRecordUseCase {
  constructor(
    @Inject(ACADEMIC_RECORD_REPOSITORY)
    private readonly repo: IAcademicRecordRepository,
  ) {}

  async execute(id: string, tenantId: string): Promise<void> {
    await this.repo.delete(id, tenantId);
  }
}
