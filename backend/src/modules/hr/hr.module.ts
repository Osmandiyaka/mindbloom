import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DepartmentSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/department.schema';
import { DesignationSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/designation.schema';
import { StaffSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/staff.schema';
import { LeaveTypeSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/leave-type.schema';
import { LeaveRequestSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/leave-request.schema';
import { StaffAttendanceSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/staff-attendance.schema';
import { HrService } from './hr.service';
import { HrController } from './hr.controller';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'Department', schema: DepartmentSchema },
            { name: 'Designation', schema: DesignationSchema },
            { name: 'Staff', schema: StaffSchema },
            { name: 'LeaveType', schema: LeaveTypeSchema },
            { name: 'LeaveRequest', schema: LeaveRequestSchema },
            { name: 'StaffAttendance', schema: StaffAttendanceSchema },
        ]),
    ],
    controllers: [HrController],
    providers: [HrService],
    exports: [HrService],
})
export class HrModule { }
