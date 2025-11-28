import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn, IsObject } from 'class-validator';

export class UpdateTenantSettingsDto {
    @ApiPropertyOptional({ description: 'Primary brand color' })
    @IsOptional()
    @IsString()
    primaryColor?: string;

    @ApiPropertyOptional({ description: 'Secondary brand color' })
    @IsOptional()
    @IsString()
    secondaryColor?: string;

    @ApiPropertyOptional({ description: 'Accent color' })
    @IsOptional()
    @IsString()
    accentColor?: string;

    @ApiPropertyOptional({ description: 'Logo URL' })
    @IsOptional()
    @IsString()
    logo?: string;

    @ApiPropertyOptional({ description: 'Locale (e.g., en-US)' })
    @IsOptional()
    @IsString()
    locale?: string;

    @ApiPropertyOptional({ description: 'Timezone (IANA)' })
    @IsOptional()
    @IsString()
    timezone?: string;

    @ApiPropertyOptional({ description: 'Week start day' })
    @IsOptional()
    @IsIn(['monday', 'sunday'])
    weekStartsOn?: 'monday' | 'sunday';

    @ApiPropertyOptional({ description: 'Currency code (e.g., USD)' })
    @IsOptional()
    @IsString()
    currency?: string;

    @ApiPropertyOptional({ description: 'Academic year start date (ISO)' })
    @IsOptional()
    @IsString()
    academicYearStart?: string;

    @ApiPropertyOptional({ description: 'Academic year end date (ISO)' })
    @IsOptional()
    @IsString()
    academicYearEnd?: string;

    @ApiPropertyOptional({ description: 'Additional settings payload' })
    @IsOptional()
    @IsObject()
    extras?: Record<string, any>;
}
