import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum LocationType {
    BUILDING = 'BUILDING',
    FLOOR = 'FLOOR',
    ROOM = 'ROOM',
    SECTION = 'SECTION',
    AISLE = 'AISLE',
    SHELF = 'SHELF',
    BIN = 'BIN',
}

/**
 * Hierarchical location structure for organizing physical copies
 * Example: Main Building → 2nd Floor → Reading Room → Fiction Section → Aisle A → Shelf 3 → Bin 5
 */
@Schema({ timestamps: true, collection: 'library_locations' })
export class LibraryLocation extends Document {
    @Prop({ required: true, index: true })
    tenantId: string;

    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    code: string; // Short code like "MB-2F-RR-FS-A-3-5"

    @Prop({
        type: String,
        enum: Object.values(LocationType),
        required: true
    })
    type: LocationType;

    // Hierarchy
    @Prop({ type: Types.ObjectId, ref: 'LibraryLocation', index: true })
    parentId: Types.ObjectId;

    @Prop({ type: [Types.ObjectId], default: [] })
    childIds: Types.ObjectId[];

    @Prop({ default: 0 })
    level: number; // 0 = root (building), 1 = floor, etc.

    @Prop()
    fullPath: string; // Denormalized: "Main Building/2nd Floor/Reading Room/Fiction/A/3/5"

    // Capacity
    @Prop()
    capacity: number; // max items that can fit

    @Prop({ default: 0 })
    currentCount: number; // current number of items

    // Physical Details
    @Prop()
    description: string;

    @Prop()
    floor: number;

    @Prop({ type: Object })
    coordinates: {
        latitude?: number;
        longitude?: number;
    };

    @Prop()
    mapImageUrl: string; // floor plan or photo

    // Access Control
    @Prop({ default: false })
    isRestricted: boolean;

    @Prop({ type: [String] })
    allowedRoles: string[];

    // Status
    @Prop({ default: true })
    isActive: boolean;

    @Prop()
    notes: string;

    // Audit
    @Prop()
    createdBy: string;

    @Prop()
    lastModifiedBy: string;
}

export const LibraryLocationSchema = SchemaFactory.createForClass(LibraryLocation);

// Indexes
LibraryLocationSchema.index({ tenantId: 1, code: 1 }, { unique: true });
LibraryLocationSchema.index({ tenantId: 1, parentId: 1 });
LibraryLocationSchema.index({ tenantId: 1, type: 1 });
LibraryLocationSchema.index({ tenantId: 1, isActive: 1 });
