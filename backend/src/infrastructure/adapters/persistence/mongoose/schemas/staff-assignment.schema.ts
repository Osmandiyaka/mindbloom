import { Schema, Types } from 'mongoose';

const ROLE_IN_ASSIGNMENT = ['teacher', 'homeroomTeacher', 'headOfDepartment', 'admin', 'support'] as const;

export const StaffAssignmentSchema = new Schema(
    {
        tenantId: { type: Types.ObjectId, ref: 'Tenant', required: true, index: true },
        staffMemberId: { type: Types.ObjectId, ref: 'Staff', required: true },
        academicYearId: { type: Types.ObjectId, ref: 'AcademicYear' },
        schoolId: { type: Types.ObjectId, ref: 'School' },
        roleInAssignment: { type: String, enum: ROLE_IN_ASSIGNMENT },
        gradeId: { type: Types.ObjectId, ref: 'Grade' },
        sectionId: { type: Types.ObjectId, ref: 'Section' },
        subjectId: { type: Types.ObjectId, ref: 'Subject' },
        startDate: { type: Date },
        endDate: { type: Date },
        status: { type: String },
    },
    { timestamps: true, strict: true }
);

StaffAssignmentSchema.index({ tenantId: 1, staffMemberId: 1, academicYearId: 1 });
StaffAssignmentSchema.index({ tenantId: 1, schoolId: 1, academicYearId: 1 });
