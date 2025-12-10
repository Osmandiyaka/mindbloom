import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'attendance', timestamps: true })
export class AttendanceDocument extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Student', required: true, index: true })
  studentId: Types.ObjectId;

  @Prop({ required: false })
  class?: string;

  @Prop({ required: false })
  section?: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true, enum: ['present', 'absent', 'late', 'excused'] })
  status: string;

  @Prop()
  reason?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  recordedBy: Types.ObjectId;

  @Prop({ required: true })
  recordedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const AttendanceSchema = SchemaFactory.createForClass(AttendanceDocument);

// Ensure uniqueness per student/date
AttendanceSchema.index({ tenantId: 1, studentId: 1, date: 1 }, { unique: true });
