import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'student_notes', timestamps: { createdAt: true, updatedAt: false } })
export class StudentNoteDocument extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', index: true, required: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Student', index: true, required: true })
  studentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Staff', required: true })
  staffId: Types.ObjectId;

  @Prop({ enum: ['general', 'conduct', 'academic'], required: true })
  category: string;

  @Prop({ required: true })
  content: string;

  createdAt: Date;
}

export const StudentNoteSchema = SchemaFactory.createForClass(StudentNoteDocument);
