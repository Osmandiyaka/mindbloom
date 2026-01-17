import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DepartmentSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/department.schema';
import { DesignationSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/designation.schema';
import { StaffSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/staff.schema';
import { StaffActivityEventSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/staff-activity-event.schema';
import { StaffAssignmentSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/staff-assignment.schema';
import { StaffCertificationSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/staff-certification.schema';
import { StaffContactSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/staff-contact.schema';
import { StaffDocumentSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/staff-document.schema';
import { StaffDocumentTypeSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/staff-document-type.schema';
import { StaffEmergencyContactSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/staff-emergency-contact.schema';
import { StaffEmploymentSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/staff-employment.schema';
import { StaffNoteSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/staff-note.schema';
import { StaffQualificationSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/staff-qualification.schema';
import { StaffSchemaConfigSchema } from '../../infrastructure/adapters/persistence/mongoose/schemas/staff-schema-config.schema';
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
            { name: 'StaffContact', schema: StaffContactSchema },
            { name: 'StaffEmergencyContact', schema: StaffEmergencyContactSchema },
            { name: 'StaffEmployment', schema: StaffEmploymentSchema },
            { name: 'StaffAssignment', schema: StaffAssignmentSchema },
            { name: 'StaffDocumentType', schema: StaffDocumentTypeSchema },
            { name: 'StaffDocument', schema: StaffDocumentSchema },
            { name: 'StaffQualification', schema: StaffQualificationSchema },
            { name: 'StaffCertification', schema: StaffCertificationSchema },
            { name: 'StaffNote', schema: StaffNoteSchema },
            { name: 'StaffActivityEvent', schema: StaffActivityEventSchema },
            { name: 'StaffSchemaConfig', schema: StaffSchemaConfigSchema },
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
