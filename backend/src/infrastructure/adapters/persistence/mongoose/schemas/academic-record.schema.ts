import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'academic_records', timestamps: true })
export class AcademicRecordDocument extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Student', required: true, index: true })
  studentId: Types.ObjectId;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  exam: string;

  @Prop()
  term?: string;

  @Prop()
  academicYear?: string;

  @Prop()
  class?: string;

  @Prop()
  section?: string;

  @Prop()
  score?: number;

  @Prop()
  grade?: string;

  @Prop()
  remarks?: string;

  @Prop({ required: true })
  recordedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  recordedBy: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const AcademicRecordSchema = SchemaFactory.createForClass(AcademicRecordDocument);

AcademicRecordSchema.index({ tenantId: 1, studentId: 1, exam: 1, subject: 1 });
