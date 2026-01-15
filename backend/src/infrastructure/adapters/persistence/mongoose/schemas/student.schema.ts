import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

class Address {
    @Prop({ required: true })
    street: string;

    @Prop({ required: true })
    city: string;

    @Prop({ required: true })
    state: string;

    @Prop({ required: true })
    postalCode: string;

    @Prop({ required: true })
    country: string;
}

class Guardian {
    @Prop({ required: true })
    id: string;

    @Prop({ required: true })
    name: string;

    @Prop({ required: true, enum: ['father', 'mother', 'guardian', 'sibling', 'grandparent', 'other'] })
    relationship: string;

    @Prop({ required: true })
    phone: string;

    @Prop()
    email?: string;

    @Prop()
    occupation?: string;

    @Prop({ type: Address })
    address?: Address;

    @Prop({ required: true })
    isPrimary: boolean;

    @Prop({ required: true })
    isEmergencyContact: boolean;
}

class MedicalInfo {
    @Prop({ enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] })
    bloodGroup?: string;

    @Prop([String])
    allergies?: string[];

    @Prop([String])
    medicalConditions?: string[];

    @Prop([String])
    medications?: string[];

    @Prop()
    doctorName?: string;

    @Prop()
    doctorPhone?: string;

    @Prop()
    insuranceProvider?: string;

    @Prop()
    insuranceNumber?: string;
}

class DocumentInfo {
    @Prop({ required: true })
    id: string;

    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    type: string;

    @Prop({ required: true })
    url: string;

    @Prop({ required: true })
    uploadedAt: Date;
}

class EnrollmentInfo {
    @Prop({ required: true })
    admissionNumber: string;

    @Prop({ required: true })
    admissionDate: Date;

    @Prop({ required: true })
    academicYear: string;

    @Prop({ required: true })
    class: string;

    @Prop()
    section?: string;

    @Prop()
    rollNumber?: string;

    @Prop()
    previousSchool?: string;

    @Prop()
    previousClass?: string;
}

@Schema({ collection: 'students', timestamps: true })
export class StudentDocument extends Document {
    @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
    tenantId: Types.ObjectId;

    @Prop({ required: true })
    schoolId: string;

    @Prop()
    admissionId?: string;

    // Personal Information
    @Prop({ required: true })
    firstName: string;

    @Prop({ required: true })
    lastName: string;

    @Prop()
    middleName?: string;

    @Prop({ required: true })
    dateOfBirth: Date;

    @Prop({ enum: ['male', 'female', 'other'], required: true })
    gender: string;

    @Prop()
    nationality?: string;

    @Prop()
    religion?: string;

    @Prop()
    caste?: string;

    // Contact Information
    @Prop()
    email?: string;

    @Prop()
    phone?: string;

    @Prop({ type: Address })
    address?: Address;

    // Guardians
    @Prop({ type: [Guardian], required: true })
    guardians: Guardian[];

    // Medical Information
    @Prop({ type: MedicalInfo })
    medicalInfo?: MedicalInfo;

    // Enrollment Information
    @Prop({ type: EnrollmentInfo, required: true })
    enrollment: EnrollmentInfo;

    // Status
    @Prop({
        required: true,
        enum: ['active', 'inactive', 'graduated', 'transferred', 'withdrawn', 'suspended'],
        default: 'active'
    })
    status: string;

    // Documents
    @Prop([DocumentInfo])
    documents?: DocumentInfo[];

    // Additional Information
    @Prop()
    photo?: string;

    createdAt: Date;
    updatedAt: Date;
}

export const StudentSchema = SchemaFactory.createForClass(StudentDocument);

// Indexes for efficient queries
StudentSchema.index({ tenantId: 1, 'enrollment.admissionNumber': 1 }, { unique: true });
StudentSchema.index({ tenantId: 1, schoolId: 1 });
StudentSchema.index({ tenantId: 1, firstName: 1, lastName: 1 });
StudentSchema.index({ tenantId: 1, 'enrollment.class': 1, 'enrollment.section': 1 });
StudentSchema.index({ tenantId: 1, status: 1 });
StudentSchema.index({ tenantId: 1, email: 1 });
