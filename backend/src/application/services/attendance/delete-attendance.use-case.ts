import { Inject, Injectable } from '@nestjs/common';
import { ATTENDANCE_REPOSITORY, IAttendanceRepository } from '../../../domain/ports/out/attendance-repository.port';

@Injectable()
export class DeleteAttendanceUseCase {
  constructor(
    @Inject(ATTENDANCE_REPOSITORY)
    private readonly repo: IAttendanceRepository,
  ) {}

  async execute(id: string, tenantId: string): Promise<void> {
    await this.repo.delete(id, tenantId);
  }
}
