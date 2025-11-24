import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum MemberType {
    STUDENT = 'STUDENT',
    TEACHER = 'TEACHER',
    STAFF = 'STAFF',
}

export enum MemberStatus {
    ACTIVE = 'ACTIVE',
    SUSPENDED = 'SUSPENDED',
    BLOCKED = 'BLOCKED',
    INACTIVE = 'INACTIVE',
}

@Schema({ timestamps: true, collection: 'library_members' })
export class LibraryMember extends Document {
    @Prop({ required: true })
    tenantId: string;

    @Prop({ required: true })
    userId: string; // Reference to Student/Teacher/Staff

    @Prop({ required: true, enum: Object.values(MemberType) })
    memberType: MemberType;

    @Prop({ required: true, unique: true })
    membershipNumber: string;

    @Prop({ required: true })
    name: string;

    @Prop()
    email: string;

    @Prop()
    phone: string;

    @Prop()
    classSection: string; // For students

    @Prop()
    department: string; // For teachers/staff

    @Prop({ required: true, enum: Object.values(MemberStatus) })
    status: MemberStatus;

    @Prop()
    membershipStartDate: Date;

    @Prop()
    membershipEndDate: Date;

    @Prop({ default: 0 })
    activeLoans: number;

    @Prop({ default: 0 })
    totalBorrowed: number;

    @Prop({ default: 0 })
    outstandingFines: number;

    @Prop({ default: 0 })
    maxBooksAllowed: number;

    @Prop({ default: false })
    isBlocked: boolean;

    @Prop()
    blockReason: string;

    @Prop()
    blockDate: Date;

    @Prop()
    photoUrl: string;

    @Prop({ type: [String], default: [] })
    preferredCategories: string[];

    @Prop()
    notes: string;

    @Prop({ default: true })
    isActive: boolean;
}

export const LibraryMemberSchema = SchemaFactory.createForClass(LibraryMember);

// Indexes
LibraryMemberSchema.index({ tenantId: 1, userId: 1 }, { unique: true });
LibraryMemberSchema.index({ tenantId: 1, membershipNumber: 1 }, { unique: true });
LibraryMemberSchema.index({ tenantId: 1, status: 1 });
LibraryMemberSchema.index({ tenantId: 1, memberType: 1 });
