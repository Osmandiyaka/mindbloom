import { IsObject, IsOptional, IsBoolean, IsString, IsNumber, IsArray, IsNotEmpty, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class LoanPolicyDto {
    @IsNumber()
    @Min(1)
    loanPeriodDays: number;

    @IsNumber()
    @Min(0)
    maxRenewals: number;

    @IsNumber()
    @Min(1)
    maxItemsCheckedOut: number;

    @IsNumber()
    @Min(0)
    maxReservations: number;

    @IsBoolean()
    canRenewOverdue: boolean;
}

export class FinePolicyDto {
    @IsNumber()
    @Min(0)
    overdueRatePerDay: number;

    @IsNumber()
    @Min(0)
    maxFineAmount: number;

    @IsNumber()
    @Min(0)
    gracePeriodDays: number;

    @IsNumber()
    @Min(1)
    lostItemReplacementMultiplier: number;

    @IsNumber()
    @Min(0)
    @Max(100)
    damagedItemFinePercentage: number;

    @IsNumber()
    @Min(0)
    processingFee: number;
}

export class ReservationPolicyDto {
    @IsNumber()
    @Min(1)
    holdDays: number;

    @IsNumber()
    @Min(1)
    maxNotifications: number;

    @IsNumber()
    @Min(1)
    notificationIntervalDays: number;

    @IsNumber()
    @Min(1)
    autoExpireHours: number;

    @IsBoolean()
    allowAutoCheckout: boolean;
}

export class UpdateSettingsDto {
    @IsObject()
    @IsOptional()
    loanPolicies?: {
        [patronType: string]: LoanPolicyDto;
    };

    @IsObject()
    @IsOptional()
    @Type(() => LoanPolicyDto)
    defaultLoanPolicy?: LoanPolicyDto;

    @IsObject()
    @IsOptional()
    @Type(() => FinePolicyDto)
    finePolicy?: FinePolicyDto;

    @IsObject()
    @IsOptional()
    @Type(() => ReservationPolicyDto)
    reservationPolicy?: ReservationPolicyDto;

    @IsObject()
    @IsOptional()
    notificationSettings?: {
        overdueReminderDays: number[];
        dueSoonDays: number;
        reservationAvailableChannels: string[];
        overdueChannels: string[];
        enableEmailNotifications: boolean;
        enableSmsNotifications: boolean;
        enableInAppNotifications: boolean;
    };

    @IsObject()
    @IsOptional()
    barcodeSettings?: {
        prefix: string;
        length: number;
        checkDigit: boolean;
        format: string;
    };

    @IsObject()
    @IsOptional()
    catalogingSettings?: {
        defaultClassificationSystem: string;
        requireISBN: boolean;
        autoFetchMetadata: boolean;
        metadataSources: string[];
    };

    @IsObject()
    @IsOptional()
    circulationSettings?: {
        enableSelfCheckout: boolean;
        enableSelfCheckin: boolean;
        requireLibrarianApproval: boolean;
        blockCheckoutIfFines: boolean;
        fineThresholdForBlock: number;
        enableBulkCheckout: boolean;
        enableBulkCheckin: boolean;
    };

    @IsObject()
    @IsOptional()
    featureFlags?: {
        enableReservations: boolean;
        enableFines: boolean;
        enableEBooks: boolean;
        enableAudioBooks: boolean;
        enablePeriodicalsModule: boolean;
        enableRFID: boolean;
        enableBarcodeScanner: boolean;
    };
}

export class GetLoanPolicyDto {
    @IsString()
    @IsNotEmpty()
    patronType: string;
}
