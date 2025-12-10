import { Inject, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { AttendanceRecord, AttendanceRecordProps } from '../../../domain/attendance/entities/attendance-record.entity';
import { ATTENDANCE_REPOSITORY, IAttendanceRepository } from '../../../domain/ports/out/attendance-repository.port';
import { CreateAttendanceCommand } from '../../ports/in/commands/create-attendance.command';

@Injectable()
export class RecordAttendanceUseCase {
  constructor(
    @Inject(ATTENDANCE_REPOSITORY)
    private readonly repo: IAttendanceRepository,
  ) {}

  async execute(command: CreateAttendanceCommand): Promise<AttendanceRecord> {
    const recordId = new Types.ObjectId().toString();
    const recordDate = new Date(command.date);

    const props: AttendanceRecordProps = {
      id: recordId,
      tenantId: command.tenantId,
      studentId: command.studentId,
      class: command.class,
      section: command.section,
      date: recordDate,
      status: command.status,
      reason: command.reason,
      recordedBy: command.recordedBy,
      recordedAt: new Date(),
    };

    const record = new AttendanceRecord(props);
    return this.repo.create(record);
  }
}
