import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsMongoId, IsDate, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CopyStatus, CopyCondition } from '../schemas/copy.schema';

export class CreateCopyDto {
    @IsMongoId()
    @IsNotEmpty()
    bookTitleId: string;

    @IsString()
    @IsNotEmpty()
    barcode: string;

    @IsEnum(CopyStatus)
    @IsOptional()
    status?: CopyStatus = CopyStatus.AVAILABLE;

    @IsEnum(CopyCondition)
    @IsOptional()
    condition?: CopyCondition = CopyCondition.GOOD;

    @IsMongoId()
    @IsOptional()
    locationId?: string;

    @IsNumber()
    @IsOptional()
    @Min(0)
    acquisitionCost?: number;

    @IsDate()
    @IsOptional()
    @Type(() => Date)
    acquisitionDate?: Date;

    @IsString()
    @IsOptional()
    vendor?: string;

    @IsString()
    @IsOptional()
    invoiceNumber?: string;

    @IsString()
    @IsOptional()
    donorName?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}

export class UpdateCopyDto {
    @IsEnum(CopyStatus)
    @IsOptional()
    status?: CopyStatus;

    @IsEnum(CopyCondition)
    @IsOptional()
    condition?: CopyCondition;

    @IsMongoId()
    @IsOptional()
    locationId?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}

export class UpdateCopyStatusDto {
    @IsEnum(CopyStatus)
    @IsNotEmpty()
    newStatus: CopyStatus;

    @IsString()
    @IsOptional()
    reason?: string;

    @IsString()
    @IsOptional()
    updatedBy?: string;
}

export class CopyQueryDto {
    @IsMongoId()
    @IsOptional()
    bookTitleId?: string;

    @IsString()
    @IsOptional()
    barcode?: string;

    @IsEnum(CopyStatus)
    @IsOptional()
    status?: CopyStatus;

    @IsEnum(CopyCondition)
    @IsOptional()
    condition?: CopyCondition;

    @IsMongoId()
    @IsOptional()
    locationId?: string;

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

export class BulkCreateCopiesDto {
    @IsMongoId()
    @IsNotEmpty()
    bookTitleId: string;

    @IsNumber()
    @IsNotEmpty()
    @Min(1)
    quantity: number;

    @IsEnum(CopyCondition)
    @IsOptional()
    condition?: CopyCondition = CopyCondition.GOOD;

    @IsMongoId()
    @IsOptional()
    locationId?: string;

    @IsNumber()
    @IsOptional()
    @Min(0)
    acquisitionCost?: number;

    @IsDate()
    @IsOptional()
    @Type(() => Date)
    acquisitionDate?: Date;

    @IsString()
    @IsOptional()
    vendor?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}
