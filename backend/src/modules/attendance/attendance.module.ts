import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AttendanceController } from './attendance.controller';
import { AttendanceSchema, AttendanceDocument } from '../../infrastructure/adapters/persistence/mongoose/schemas/attendance.schema';
import { ATTENDANCE_REPOSITORY } from '../../domain/ports/out/attendance-repository.port';
import { MongooseAttendanceRepository } from '../../infrastructure/adapters/persistence/mongoose/mongoose-attendance.repository';
import { RecordAttendanceUseCase } from '../../application/services/attendance/record-attendance.use-case';
import { UpdateAttendanceUseCase } from '../../application/services/attendance/update-attendance.use-case';
import { ListAttendanceUseCase } from '../../application/services/attendance/list-attendance.use-case';
import { DeleteAttendanceUseCase } from '../../application/services/attendance/delete-attendance.use-case';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: AttendanceDocument.name, schema: AttendanceSchema },
        ]),
    ],
    controllers: [AttendanceController],
    providers: [
        {
            provide: ATTENDANCE_REPOSITORY,
            useClass: MongooseAttendanceRepository,
        },
        RecordAttendanceUseCase,
        UpdateAttendanceUseCase,
        ListAttendanceUseCase,
        DeleteAttendanceUseCase,
    ],
    exports: [ATTENDANCE_REPOSITORY],
})
export class AttendanceModule { }
