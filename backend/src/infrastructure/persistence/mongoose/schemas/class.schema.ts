import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'classes', timestamps: true })
export class ClassDocument extends Document {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    grade: string;

    @Prop({ required: true })
    section: string;

    @Prop()
    capacity?: number;

    @Prop()
    teacherId?: string;

    createdAt: Date;
    updatedAt: Date;
}

export const ClassSchema = SchemaFactory.createForClass(ClassDocument);
