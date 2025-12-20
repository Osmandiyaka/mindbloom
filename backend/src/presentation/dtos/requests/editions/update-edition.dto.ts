import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Min, IsNumber } from 'class-validator';

export class UpdateEditionDto {
    @ApiProperty({ description: 'Display name', required: false })
    @IsOptional()
    @IsString()
    displayName?: string;

    @ApiProperty({ description: 'Description', required: false })
    @IsOptional()
    @IsString()
    description?: string | null;

    @ApiProperty({ description: 'Is active', required: false })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiProperty({ description: 'Sort order', required: false })
    @IsOptional()
    @IsInt()
    @Min(0)
    sortOrder?: number;

    @ApiProperty({ description: 'Monthly price in USD', required: false })
    @IsOptional()
    @IsNumber()
    @Min(0)
    monthlyPrice?: number | null;

    @ApiProperty({ description: 'Annual price in USD', required: false })
    @IsOptional()
    @IsNumber()
    @Min(0)
    annualPrice?: number | null;

    @ApiProperty({ description: 'Per-student monthly price', required: false })
    @IsOptional()
    @IsNumber()
    @Min(0)
    perStudentMonthly?: number | null;

    @ApiProperty({ description: 'Notes about annual pricing', required: false })
    @IsOptional()
    @IsString()
    annualPriceNotes?: string | null;
}
