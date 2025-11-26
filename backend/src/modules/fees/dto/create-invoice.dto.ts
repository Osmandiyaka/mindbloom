import { IsDateString, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateInvoiceDto {
    @IsMongoId()
    @IsOptional()
    studentId?: string;

    @IsString()
    @IsNotEmpty()
    studentName: string;

    @IsMongoId()
    planId: string;

    @IsString()
    @IsOptional()
    planName?: string;

    @IsDateString()
    dueDate: string;

    @IsNumber()
    @Min(0)
    amount: number;

    @IsString()
    @IsOptional()
    currency?: string;

    @IsString()
    @IsOptional()
    reference?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}
