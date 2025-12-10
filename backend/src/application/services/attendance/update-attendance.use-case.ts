import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AttendanceRecord } from '../../../domain/attendance/entities/attendance-record.entity';
import { ATTENDANCE_REPOSITORY, IAttendanceRepository } from '../../../domain/ports/out/attendance-repository.port';
import { UpdateAttendanceCommand } from '../../ports/in/commands/update-attendance.command';

@Injectable()
export class UpdateAttendanceUseCase {
  constructor(
    @Inject(ATTENDANCE_REPOSITORY)
    private readonly repo: IAttendanceRepository,
  ) {}

  async execute(command: UpdateAttendanceCommand): Promise<AttendanceRecord> {
    const existing = await this.repo.findById(command.id, command.tenantId);
    if (!existing) {
      throw new NotFoundException('Attendance record not found');
    }

    existing.changeStatus(command.status, command.reason);
    return this.repo.update(existing);
  }
}
