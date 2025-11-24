import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum NotificationType {
    OVERDUE_REMINDER = 'OVERDUE_REMINDER',
    DUE_SOON = 'DUE_SOON',
    RESERVATION_AVAILABLE = 'RESERVATION_AVAILABLE',
    RESERVATION_EXPIRING = 'RESERVATION_EXPIRING',
    FINE_ASSESSED = 'FINE_ASSESSED',
    PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
    ITEM_RECALLED = 'ITEM_RECALLED',
    RENEWAL_CONFIRMATION = 'RENEWAL_CONFIRMATION',
    CHECKOUT_CONFIRMATION = 'CHECKOUT_CONFIRMATION',
    RETURN_CONFIRMATION = 'RETURN_CONFIRMATION',
}

export enum NotificationStatus {
    PENDING = 'PENDING',
    SENT = 'SENT',
    FAILED = 'FAILED',
    BOUNCED = 'BOUNCED',
    DELIVERED = 'DELIVERED',
    READ = 'READ',
}

export enum NotificationChannel {
    EMAIL = 'EMAIL',
    SMS = 'SMS',
    IN_APP = 'IN_APP',
    PUSH = 'PUSH',
}

/**
 * Audit log for all notifications sent to patrons
 */
@Schema({ timestamps: true, collection: 'library_notification_logs' })
export class LibraryNotificationLog extends Document {
    @Prop({ required: true, index: true })
    tenantId: string;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    recipientId: Types.ObjectId;

    @Prop({ 
        type: String, 
        enum: Object.values(NotificationType), 
        required: true,
        index: true 
    })
    type: NotificationType;

    @Prop({ 
        type: String, 
        enum: Object.values(NotificationChannel), 
        required: true 
    })
    channel: NotificationChannel;

    @Prop({ 
        type: String, 
        enum: Object.values(NotificationStatus), 
        default: NotificationStatus.PENDING,
        index: true 
    })
    status: NotificationStatus;

    // Content
    @Prop({ required: true })
    subject: string;

    @Prop({ required: true })
    message: string;

    @Prop({ type: Object })
    metadata: {
        bookTitle?: string;
        dueDate?: Date;
        fineAmount?: number;
        copyBarcode?: string;
        [key: string]: any;
    };

    // Recipient Details
    @Prop()
    recipientEmail: string;

    @Prop()
    recipientPhone: string;

    // Delivery Tracking
    @Prop({ index: true })
    sentAt: Date;

    @Prop()
    deliveredAt: Date;

    @Prop()
    readAt: Date;

    @Prop()
    failedAt: Date;

    @Prop()
    errorMessage: string;

    @Prop({ type: Object })
    providerResponse: any; // Raw response from email/SMS provider

    // Retry Tracking
    @Prop({ default: 0 })
    retryCount: number;

    @Prop()
    nextRetryAt: Date;

    @Prop({ default: 3 })
    maxRetries: number;

    // Related Entities
    @Prop({ type: Types.ObjectId, ref: 'LibraryBorrowTransaction' })
    transactionId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'LibraryReservation' })
    reservationId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'LibraryFineLedger' })
    fineLedgerId: Types.ObjectId;

    // Template
    @Prop()
    templateId: string;

    @Prop({ type: Object })
    templateVariables: any;

    // Priority
    @Prop({ default: 1 })
    priority: number; // Higher = more urgent

    @Prop({ default: false })
    isUrgent: boolean;

    // User Interaction
    @Prop()
    clickedAt: Date;

    @Prop({ type: [String] })
    clickedLinks: string[];

    @Prop({ default: false })
    userOptedOut: boolean;

    // Batch Info
    @Prop()
    batchId: string;

    @Prop()
    batchSize: number;

    @Prop()
    batchPosition: number;
}

export const LibraryNotificationLogSchema = SchemaFactory.createForClass(LibraryNotificationLog);

// Indexes
LibraryNotificationLogSchema.index({ tenantId: 1, recipientId: 1, type: 1 });
LibraryNotificationLogSchema.index({ tenantId: 1, status: 1, sentAt: -1 });
LibraryNotificationLogSchema.index({ tenantId: 1, type: 1, sentAt: -1 });
LibraryNotificationLogSchema.index({ tenantId: 1, transactionId: 1 });
LibraryNotificationLogSchema.index({ tenantId: 1, batchId: 1 });
