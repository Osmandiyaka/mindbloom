import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsEmail, MinLength, ValidateNested, IsObject, IsNumber, Matches } from 'class-validator';
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

class LimitsDto {
    @ApiPropertyOptional({ example: 100 })
    @IsOptional()
    @IsNumber()
    maxStudents?: number;

    @ApiPropertyOptional({ example: 20 })
    @IsOptional()
    @IsNumber()
    maxTeachers?: number;

    @ApiPropertyOptional({ example: 10 })
    @IsOptional()
    @IsNumber()
    maxClasses?: number;

    @ApiPropertyOptional({ example: 5 })
    @IsOptional()
    @IsNumber()
    maxAdmins?: number;

    @ApiPropertyOptional({ example: 5000, description: 'Storage in MB; use -1 for unlimited' })
    @IsOptional()
    @IsNumber()
    maxStorage?: number;

    @ApiPropertyOptional({ example: 100, description: 'Bandwidth in GB/month; use -1 for unlimited' })
    @IsOptional()
    @IsNumber()
    maxBandwidth?: number;
}

class BrandingDto {
    @ApiPropertyOptional({ description: 'School logo URL' })
    @IsOptional()
    @IsString()
    logo?: string;

    @ApiPropertyOptional({ description: 'Favicon URL' })
    @IsOptional()
    @IsString()
    favicon?: string;

    @ApiPropertyOptional({ description: 'Primary color (hex)', example: '#1F2937' })
    @IsOptional()
    @Matches(/^#[0-9A-Fa-f]{6}$/)
    primaryColor?: string;

    @ApiPropertyOptional({ description: 'Secondary color (hex)', example: '#10B981' })
    @IsOptional()
    @Matches(/^#[0-9A-Fa-f]{6}$/)
    secondaryColor?: string;

    @ApiPropertyOptional({ description: 'Accent color (hex)', example: '#F59E0B' })
    @IsOptional()
    @Matches(/^#[0-9A-Fa-f]{6}$/)
    accentColor?: string;

    @ApiPropertyOptional({ description: 'Custom domain (apex or subdomain)', example: 'school.mindbloom.app' })
    @IsOptional()
    @IsString()
    customDomain?: string;
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

    @ApiPropertyOptional({ description: 'Branding settings' })
    @IsOptional()
    @ValidateNested()
    @Type(() => BrandingDto)
    branding?: BrandingDto;

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

    @ApiPropertyOptional({ description: 'Override edition limits' })
    @IsOptional()
    @ValidateNested()
    @Type(() => LimitsDto)
    limits?: LimitsDto;

    @ApiPropertyOptional({ description: 'Tenant edition code (recommended). Use this to select a tenant edition.' })
    @IsOptional()
    @IsString()
    edition?: string;

    @ApiPropertyOptional({ description: 'Tenant edition id (preferred). Use this when you have the canonical edition id.' })
    @IsOptional()
    @IsString()
    editionId?: string;


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
