import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsEmail, MinLength, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

class AddressDto {
    @ApiPropertyOptional({ example: '123 Main St' })
    @IsOptional()
    @IsString()
    street?: string;

    @ApiPropertyOptional({ example: 'Springfield' })
    @IsOptional()
    @IsString()
    city?: string;

    @ApiPropertyOptional({ example: 'CA' })
    @IsOptional()
    @IsString()
    state?: string;

    @ApiPropertyOptional({ example: '90210' })
    @IsOptional()
    @IsString()
    postalCode?: string;

    @ApiPropertyOptional({ example: 'USA' })
    @IsOptional()
    @IsString()
    country?: string;
}

export class CreateTenantDto {
    @ApiProperty({ description: 'Tenant name', example: 'Greenfield High School' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ description: 'Tenant subdomain/code. If omitted, the system generates from name.', example: 'greenfield' })
    @IsOptional()
    @IsString()
    subdomain?: string;

    @ApiProperty({ description: 'Primary contact email', example: 'admin@greenfield.edu' })
    @IsEmail()
    contactEmail: string;

    @ApiPropertyOptional({ description: 'Primary contact phone', example: '+1-202-555-0123' })
    @IsOptional()
    @IsString()
    contactPhone?: string;

    @ApiPropertyOptional({ description: 'School address' })
    @IsOptional()
    @ValidateNested()
    @Type(() => AddressDto)
    address?: AddressDto;

    @ApiPropertyOptional({ description: 'School logo URL' })
    @IsOptional()
    @IsString()
    logo?: string;

    @ApiProperty({ description: 'Owner user id', required: false })
    @IsOptional()
    @IsString()
    ownerId?: string;

    @ApiPropertyOptional({ description: 'Locale (defaults to en-GB)', example: 'en-GB' })
    @IsOptional()
    @IsString()
    locale?: string;

    @ApiPropertyOptional({ description: 'Timezone (defaults to Europe/London)', example: 'Europe/London' })
    @IsOptional()
    @IsString()
    timezone?: string;

    @ApiPropertyOptional({ description: 'Week start (defaults to monday)', enum: ['monday', 'sunday'] })
    @IsOptional()
    @IsEnum(['monday', 'sunday'])
    weekStartsOn?: 'monday' | 'sunday';

    @ApiPropertyOptional({ description: 'Academic year template', example: { start: '2025-09-01', end: '2026-07-31', name: 'AY 2025-2026' } })
    @IsOptional()
    @IsObject()
    academicYear?: {
        start: string;
        end: string;
        name?: string;
    };

    @ApiProperty({
        description: 'Tenant plan',
        enum: ['trial', 'free', 'basic', 'premium', 'enterprise'],
        required: false,
        default: 'trial'
    })
    @IsEnum(['trial', 'free', 'basic', 'premium', 'enterprise'])
    @IsOptional()
    plan?: 'trial' | 'free' | 'basic' | 'premium' | 'enterprise';

    @ApiProperty({ description: 'Admin full name', example: 'Jane Doe' })
    @IsString()
    @IsNotEmpty()
    adminName: string;

    @ApiProperty({ description: 'Admin email', example: 'admin@greenfield.edu' })
    @IsEmail()
    adminEmail: string;

    @ApiPropertyOptional({ description: 'Admin password. If omitted, a secure temporary password will be generated and force-reset enforced.', example: 'Str0ngP@ssw0rd!' })
    @IsOptional()
    @IsString()
    @MinLength(8)
    adminPassword?: string;
}
