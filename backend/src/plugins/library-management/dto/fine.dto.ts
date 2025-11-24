import { IsMongoId, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsString, IsDate, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { FineEntryType, FineReason, PaymentMethod } from '../schemas/fine-ledger.schema';

export class AssessFineDto {
    @IsMongoId()
    @IsNotEmpty()
    patronId: string;

    @IsMongoId()
    @IsOptional()
    transactionId?: string;

    @IsMongoId()
    @IsOptional()
    copyId?: string;

    @IsNumber()
    @IsNotEmpty()
    @Min(0.01)
    amount: number;

    @IsEnum(FineReason)
    @IsNotEmpty()
    reason: FineReason;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @IsOptional()
    @Min(0)
    daysOverdue?: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    fineRatePerDay?: number;
}

export class RecordPaymentDto {
    @IsMongoId()
    @IsNotEmpty()
    patronId: string;

    @IsNumber()
    @IsNotEmpty()
    @Min(0.01)
    amount: number;

    @IsEnum(PaymentMethod)
    @IsNotEmpty()
    paymentMethod: PaymentMethod;

    @IsString()
    @IsOptional()
    paymentReference?: string; // Receipt #, Transaction ID, Cheque #

    @IsDate()
    @IsOptional()
    @Type(() => Date)
    paymentDate?: Date;

    @IsString()
    @IsOptional()
    paymentNotes?: string;

    @IsMongoId()
    @IsOptional()
    transactionId?: string; // If paying for specific transaction
}

export class WaiveFineDto {
    @IsMongoId()
    @IsNotEmpty()
    patronId: string;

    @IsNumber()
    @IsNotEmpty()
    @Min(0.01)
    amount: number;

    @IsString()
    @IsNotEmpty()
    waiverReason: string;

    @IsOptional()
    waiverApprovalRequired?: boolean = true;

    @IsMongoId()
    @IsOptional()
    transactionId?: string;
}

export class VoidEntryDto {
    @IsMongoId()
    @IsNotEmpty()
    entryId: string;

    @IsString()
    @IsNotEmpty()
    voidReason: string;
}

export class FineLedgerQueryDto {
    @IsMongoId()
    @IsOptional()
    patronId?: string;

    @IsMongoId()
    @IsOptional()
    transactionId?: string;

    @IsEnum(FineEntryType)
    @IsOptional()
    entryType?: FineEntryType;

    @IsEnum(FineReason)
    @IsOptional()
    reason?: FineReason;

    @IsDate()
    @IsOptional()
    @Type(() => Date)
    fromDate?: Date;

    @IsDate()
    @IsOptional()
    @Type(() => Date)
    toDate?: Date;

    @IsOptional()
    @Type(() => Boolean)
    isVoided?: boolean = false;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    @Min(1)
    page?: number = 1;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    @Min(1)
    limit?: number = 50;
}

export class PatronBalanceDto {
    @IsMongoId()
    @IsNotEmpty()
    patronId: string;
}
