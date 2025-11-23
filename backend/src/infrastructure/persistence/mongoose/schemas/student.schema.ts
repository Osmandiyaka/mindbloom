import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'students', timestamps: true })
export class StudentDocument extends Document {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true, unique: true })
    email: string;

    @Prop()
    phone?: string;

    @Prop()
    dob?: Date;

    @Prop({ type: Types.ObjectId, ref: 'ClassDocument' })
    classId?: Types.ObjectId;

    @Prop()
    rollNo?: string;

    @Prop({ default: 'Active' })
    status: string;

    createdAt: Date;
    updatedAt: Date;
}

export const StudentSchema = SchemaFactory.createForClass(StudentDocument);
