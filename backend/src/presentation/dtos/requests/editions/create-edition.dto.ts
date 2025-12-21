import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsInt, Min, IsNumber } from 'class-validator';

export class CreateEditionDto {
    @ApiProperty({ description: 'System name (unique, lowercase)' })
    @IsString()
    @IsNotEmpty()
    name!: string;

    @ApiProperty({ description: 'Display name shown to users' })
    @IsString()
    @IsNotEmpty()
    displayName!: string;

    @ApiProperty({ description: 'Edition description', required: false })
    @IsOptional()
    @IsString()
    description?: string | null;

    @ApiProperty({ description: 'Whether edition is active', required: false, default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiProperty({ description: 'Sort order (ascending)', required: false, default: 0 })
    @IsOptional()
    @IsInt()
    @Min(0)
    sortOrder?: number;

    @ApiProperty({ description: 'Monthly price in USD (integer cents or dollars depending on convention)', required: false })
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

    @ApiProperty({ description: 'Notes about annual pricing (e.g., "Custom")', required: false })
    @IsOptional()
    @IsString()
    annualPriceNotes?: string | null;

    @ApiProperty({ description: 'Feature module keys enabled for this edition', required: false, type: [String] })
    @IsOptional()
    modules?: string[];
}
