import { Inject, Injectable } from '@nestjs/common';
import { AttendanceRecord } from '../../../domain/attendance/entities/attendance-record.entity';
import { ATTENDANCE_REPOSITORY, AttendanceFilters, IAttendanceRepository } from '../../../domain/ports/out/attendance-repository.port';

@Injectable()
export class ListAttendanceUseCase {
  constructor(
    @Inject(ATTENDANCE_REPOSITORY)
    private readonly repo: IAttendanceRepository,
  ) {}

  async execute(tenantId: string, filters: AttendanceFilters = {}): Promise<AttendanceRecord[]> {
    return this.repo.findAll(tenantId, filters);
  }
}
