import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum ReservationStatus {
    WAITING = 'WAITING',           // In queue, waiting for copy to become available
    NOTIFIED = 'NOTIFIED',         // Copy available, patron notified
    ON_HOLD_SHELF = 'ON_HOLD_SHELF', // Copy on hold shelf, waiting for pickup
    FULFILLED = 'FULFILLED',       // Patron checked out the reserved copy
    EXPIRED = 'EXPIRED',           // Hold expired (not picked up in time)
    CANCELLED = 'CANCELLED',       // Patron or staff cancelled
}

export enum NotificationChannel {
    EMAIL = 'EMAIL',
    SMS = 'SMS',
    IN_APP = 'IN_APP',
    PHONE_CALL = 'PHONE_CALL',
}

/**
 * FIFO queue-based reservation system
 * Patrons can reserve titles, system notifies when available
 */
@Schema({ timestamps: true, collection: 'library_reservations' })
export class LibraryReservation extends Document {
    @Prop({ required: true, index: true })
    tenantId: string;

    @Prop({ type: Types.ObjectId, ref: 'LibraryBookTitle', required: true, index: true })
    bookTitleId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    patronId: Types.ObjectId;

    // Queue Position
    @Prop({ required: true, index: true })
    queuePosition: number; // 1-based position in queue

    @Prop({ default: 0 })
    initialQueueLength: number; // Queue length when patron reserved

    // Status
    @Prop({ 
        type: String, 
        enum: Object.values(ReservationStatus), 
        default: ReservationStatus.WAITING,
        index: true 
    })
    status: ReservationStatus;

    @Prop({ required: true, index: true })
    reservedAt: Date;

    @Prop()
    notifiedAt: Date;

    @Prop()
    expiresAt: Date; // When hold expires if not picked up

    @Prop()
    fulfilledAt: Date;

    @Prop()
    cancelledAt: Date;

    // Hold Details
    @Prop({ type: Types.ObjectId, ref: 'LibraryBookCopy' })
    assignedCopyId: Types.ObjectId; // Copy assigned when available

    @Prop()
    holdShelfLocationId: Types.ObjectId; // Physical location on hold shelf

    @Prop()
    pickupDeadline: Date; // Must pick up before this date/time

    @Prop({ default: 3 })
    holdDays: number; // Days to pick up once notified (policy)

    // Notifications
    @Prop({ type: [{ 
        channel: { type: String, enum: Object.values(NotificationChannel) },
        sentAt: Date,
        success: Boolean,
        error: String 
    }] })
    notifications: {
        channel: NotificationChannel;
        sentAt: Date;
        success: boolean;
        error?: string;
    }[];

    @Prop({ type: [String] })
    preferredNotificationChannels: NotificationChannel[];

    @Prop({ default: 0 })
    notificationsSent: number;

    @Prop()
    lastNotificationAt: Date;

    // Preferences
    @Prop()
    pickupLocationId: Types.ObjectId; // Preferred pickup location

    @Prop()
    preferredPickupDate: Date;

    @Prop({ default: false })
    autoCheckout: boolean; // Auto-check out when available

    // Metadata
    @Prop()
    notes: string;

    @Prop()
    cancellationReason: string;

    @Prop()
    cancelledBy: string; // User ID or 'SYSTEM'

    // Statistics
    @Prop()
    waitingDays: number; // Days spent waiting

    @Prop()
    positionsMovedUp: number; // How many positions moved up in queue

    // Fulfillment
    @Prop({ type: Types.ObjectId, ref: 'LibraryBorrowTransaction' })
    borrowTransactionId: Types.ObjectId; // Transaction created when fulfilled

    @Prop()
    fulfilledBy: string; // Librarian who processed

    // Priority (for future use)
    @Prop({ default: 0 })
    priority: number; // Higher priority = faster (for VIP, faculty, etc.)

    @Prop({ default: false })
    isUrgent: boolean;

    @Prop()
    urgentReason: string;
}

export const LibraryReservationSchema = SchemaFactory.createForClass(LibraryReservation);

// Indexes for FIFO queue management
LibraryReservationSchema.index({ tenantId: 1, bookTitleId: 1, status: 1, queuePosition: 1 });
LibraryReservationSchema.index({ tenantId: 1, patronId: 1, status: 1 });
LibraryReservationSchema.index({ tenantId: 1, status: 1, expiresAt: 1 });
LibraryReservationSchema.index({ tenantId: 1, assignedCopyId: 1 });
LibraryReservationSchema.index({ tenantId: 1, reservedAt: 1 });
LibraryReservationSchema.index({ tenantId: 1, notifiedAt: 1 });
