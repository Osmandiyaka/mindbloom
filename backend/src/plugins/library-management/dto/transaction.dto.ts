import { IsMongoId, IsNotEmpty, IsOptional, IsDate, IsString, IsNumber, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionStatus } from '../schemas/borrow-transaction.schema';

export class CheckoutDto {
    @IsMongoId()
    @IsNotEmpty()
    copyId: string;

    @IsMongoId()
    @IsNotEmpty()
    borrowerId: string;

    @IsDate()
    @IsOptional()
    @Type(() => Date)
    dueDate?: Date; // Auto-calculated from policy if not provided

    @IsString()
    @IsOptional()
    checkoutMethod?: string; // 'DESK', 'SELF_SERVICE', 'MOBILE_APP'

    @IsString()
    @IsOptional()
    notes?: string;
}

export class CheckinDto {
    @IsMongoId()
    @IsNotEmpty()
    copyId: string;

    @IsString()
    @IsOptional()
    returnCondition?: string; // 'GOOD', 'FAIR', 'DAMAGED'

    @IsString()
    @IsOptional()
    checkinMethod?: string;

    @IsString()
    @IsOptional()
    returnNotes?: string;

    @IsDate()
    @IsOptional()
    @Type(() => Date)
    returnedAt?: Date; // Defaults to now
}

export class RenewDto {
    @IsMongoId()
    @IsNotEmpty()
    transactionId: string;

    @IsString()
    @IsOptional()
    renewalNotes?: string;
}

export class TransactionQueryDto {
    @IsMongoId()
    @IsOptional()
    borrowerId?: string;

    @IsMongoId()
    @IsOptional()
    copyId?: string;

    @IsMongoId()
    @IsOptional()
    bookTitleId?: string;

    @IsEnum(TransactionStatus)
    @IsOptional()
    status?: TransactionStatus;

    @IsOptional()
    @Type(() => Boolean)
    isOverdue?: boolean;

    @IsDate()
    @IsOptional()
    @Type(() => Date)
    fromDate?: Date;

    @IsDate()
    @IsOptional()
    @Type(() => Date)
    toDate?: Date;

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

export class BulkCheckoutDto {
    @IsMongoId({ each: true })
    @IsNotEmpty()
    copyIds: string[];

    @IsMongoId()
    @IsNotEmpty()
    borrowerId: string;

    @IsString()
    @IsOptional()
    checkoutMethod?: string;
}

export class BulkCheckinDto {
    @IsMongoId({ each: true })
    @IsNotEmpty()
    copyIds: string[];

    @IsString()
    @IsOptional()
    returnCondition?: string;

    @IsString()
    @IsOptional()
    checkinMethod?: string;
}
