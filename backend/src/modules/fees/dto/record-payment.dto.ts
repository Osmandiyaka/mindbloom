import { IsDateString, IsIn, IsMongoId, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class RecordPaymentDto {
    @IsNumber()
    @Min(0.01)
    amount: number;

    @IsString()
    @IsOptional()
    currency?: string;

    @IsIn(['cash', 'card', 'transfer', 'online', 'other'])
    method: 'cash' | 'card' | 'transfer' | 'online' | 'other';

    @IsString()
    @IsOptional()
    reference?: string;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsDateString()
    @IsOptional()
    paidAt?: string;

    @IsMongoId()
    @IsOptional()
    recordedBy?: string;
}
