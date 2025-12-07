import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

export class UpdateApplicationStatusDto {
    @IsString()
    @IsNotEmpty()
    @IsEnum([
        'inquiry',
        'submitted',
        'under_review',
        'accepted',
        'rejected',
        'waitlisted',
        'enrolled',
        'withdrawn',
    ])
    status: string;

    @IsString()
    @IsOptional()
    note?: string;

    @IsString()
    @IsOptional()
    changedBy?: string;
}
