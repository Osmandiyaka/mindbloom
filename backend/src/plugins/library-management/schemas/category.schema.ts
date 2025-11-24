import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'library_categories' })
export class LibraryCategory extends Document {
    @Prop({ required: true })
    tenantId: string;

    @Prop({ required: true })
    name: string;

    @Prop()
    code: string;

    @Prop()
    description: string;

    @Prop()
    parentCategoryId: string;

    @Prop()
    icon: string;

    @Prop()
    color: string;

    @Prop({ default: 0 })
    bookCount: number;

    @Prop({ default: 0 })
    displayOrder: number;

    @Prop({ default: true })
    isActive: boolean;
}

export const LibraryCategorySchema = SchemaFactory.createForClass(LibraryCategory);

// Indexes
LibraryCategorySchema.index({ tenantId: 1, name: 1 });
LibraryCategorySchema.index({ tenantId: 1, code: 1 });
LibraryCategorySchema.index({ tenantId: 1, isActive: 1 });
