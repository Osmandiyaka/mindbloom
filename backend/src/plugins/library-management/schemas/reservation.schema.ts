import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum ReservationStatus {
    PENDING = 'PENDING',
    FULFILLED = 'FULFILLED',
    CANCELLED = 'CANCELLED',
    EXPIRED = 'EXPIRED',
}

@Schema({ timestamps: true, collection: 'library_reservations' })
export class LibraryReservation extends Document {
    @Prop({ required: true })
    tenantId: string;

    @Prop({ required: true })
    bookId: string;

    @Prop({ required: true })
    memberId: string;

    @Prop({ required: true, enum: Object.values(ReservationStatus) })
    status: ReservationStatus;

    @Prop({ required: true })
    reservationDate: Date;

    @Prop({ required: true })
    expiryDate: Date;

    @Prop()
    fulfilledDate: Date;

    @Prop()
    copyId: string;

    @Prop()
    notificationSent: boolean;

    @Prop()
    cancelledDate: Date;

    @Prop()
    cancellationReason: string;

    @Prop({ default: 0 })
    queuePosition: number;

    @Prop()
    notes: string;
}

export const LibraryReservationSchema = SchemaFactory.createForClass(LibraryReservation);

// Indexes
LibraryReservationSchema.index({ tenantId: 1, memberId: 1 });
LibraryReservationSchema.index({ tenantId: 1, bookId: 1 });
LibraryReservationSchema.index({ tenantId: 1, status: 1 });
LibraryReservationSchema.index({ tenantId: 1, expiryDate: 1 });
