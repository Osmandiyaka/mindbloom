import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Per-tenant library configuration and policies
 * Stored as JSONB-like structure for flexibility
 */
@Schema({ timestamps: true, collection: 'library_settings' })
export class LibrarySettings extends Document {
    @Prop({ required: true, unique: true, index: true })
    tenantId: string;

    // Loan Policies (per patron type)
    @Prop({ type: Object, default: {} })
    loanPolicies: {
        [patronType: string]: {
            loanPeriodDays: number;
            maxRenewals: number;
            maxItemsCheckedOut: number;
            maxReservations: number;
            canRenewOverdue: boolean;
        };
    };

    // Default loan policy
    @Prop({ type: Object })
    defaultLoanPolicy: {
        loanPeriodDays: number;
        maxRenewals: number;
        maxItemsCheckedOut: number;
        maxReservations: number;
        canRenewOverdue: boolean;
    };

    // Fine Policies
    @Prop({ type: Object })
    finePolicy: {
        overdueRatePerDay: number;
        maxFineAmount: number;
        gracePeriodDays: number;
        lostItemReplacementMultiplier: number; // e.g., 2x book price
        damagedItemFinePercentage: number; // e.g., 50% of price
        processingFee: number;
    };

    // Reservation Policies
    @Prop({ type: Object })
    reservationPolicy: {
        holdDays: number; // Days to pick up after notification
        maxNotifications: number;
        notificationIntervalDays: number;
        autoExpireHours: number; // Auto-expire if not picked up
        allowAutoCheckout: boolean;
    };

    // Renewal Policies
    @Prop({ type: Object })
    renewalPolicy: {
        renewBeforeDueDays: number; // Can renew X days before due
        renewAfterDueDays: number; // Can renew X days after due (with fine)
        blockRenewalIfReserved: boolean; // Block if others have reserved
        autoRenewEnabled: boolean;
    };

    // Notification Settings
    @Prop({ type: Object })
    notificationSettings: {
        overdueReminderDays: number[]; // e.g., [1, 3, 7, 14]
        dueSoonDays: number; // Send "due soon" reminder X days before
        reservationAvailableChannels: string[]; // ['EMAIL', 'SMS', 'IN_APP']
        overdueChannels: string[];
        enableEmailNotifications: boolean;
        enableSmsNotifications: boolean;
        enableInAppNotifications: boolean;
    };

    // Barcode Settings
    @Prop({ type: Object })
    barcodeSettings: {
        prefix: string; // e.g., 'LIB'
        length: number; // Total barcode length
        checkDigit: boolean; // Use check digit (Mod 10, Mod 11)
        format: string; // 'CODE128', 'CODE39', 'EAN13'
    };

    // Cataloging Settings
    @Prop({ type: Object })
    catalogingSettings: {
        defaultClassificationSystem: string; // 'DEWEY' or 'LOC'
        requireISBN: boolean;
        autoFetchMetadata: boolean; // Auto-fetch from Google Books, OpenLibrary
        metadataSources: string[]; // ['GOOGLE_BOOKS', 'OPEN_LIBRARY', 'WORLDCAT']
    };

    // Circulation Settings
    @Prop({ type: Object })
    circulationSettings: {
        enableSelfCheckout: boolean;
        enableSelfCheckin: boolean;
        requireLibrarianApproval: boolean;
        blockCheckoutIfFines: boolean;
        fineThresholdForBlock: number;
        enableBulkCheckout: boolean;
        enableBulkCheckin: boolean;
    };

    // Inventory Settings
    @Prop({ type: Object })
    inventorySettings: {
        lowStockThreshold: number; // Alert when available copies fall below
        enableAutomaticOrdering: boolean;
        defaultVendor: string;
        trackSerialNumbers: boolean;
    };

    // Reporting Settings
    @Prop({ type: Object })
    reportingSettings: {
        fiscalYearStart: string; // 'MM-DD' format
        currency: string;
        timezone: string;
        defaultReportFormat: string; // 'PDF', 'EXCEL', 'CSV'
    };

    // Display Settings
    @Prop({ type: Object })
    displaySettings: {
        itemsPerPage: number;
        defaultSortOrder: string;
        showCoverImages: boolean;
        coverImageSource: string; // 'GOOGLE_BOOKS', 'OPEN_LIBRARY', 'UPLOAD'
    };

    // Integration Settings
    @Prop({ type: Object })
    integrations: {
        googleBooksApiKey?: string;
        openLibraryEnabled: boolean;
        smsProvider?: string; // 'TWILIO', 'AFRICASTALKING', etc.
        smsApiKey?: string;
        emailProvider?: string;
        emailApiKey?: string;
    };

    // Business Hours
    @Prop({ type: Object })
    businessHours: {
        [dayOfWeek: string]: {
            isOpen: boolean;
            openTime: string; // 'HH:mm'
            closeTime: string; // 'HH:mm'
        };
    };

    // Holidays
    @Prop({ type: [Date] })
    holidays: Date[];

    // Custom Fields
    @Prop({ type: Object })
    customFields: {
        [key: string]: any;
    };

    // Feature Flags
    @Prop({ type: Object })
    featureFlags: {
        enableReservations: boolean;
        enableFines: boolean;
        enableEBooks: boolean;
        enableAudioBooks: boolean;
        enablePeriodicalsModule: boolean;
        enableRFID: boolean;
        enableBarcodeScanner: boolean;
    };

    // Audit
    @Prop()
    lastModifiedBy: string;

    @Prop({ default: true })
    isActive: boolean;
}

export const LibrarySettingsSchema = SchemaFactory.createForClass(LibrarySettings);

// Indexes
LibrarySettingsSchema.index({ tenantId: 1 }, { unique: true });
