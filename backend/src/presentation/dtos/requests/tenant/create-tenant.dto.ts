import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsEmail, MinLength } from 'class-validator';

export class CreateTenantDto {
    @ApiProperty({ description: 'Tenant name', example: 'Greenfield High School' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ description: 'Tenant subdomain/code', example: 'greenfield' })
    @IsString()
    @IsNotEmpty()
    subdomain: string;

    @ApiProperty({ description: 'Primary contact email', example: 'admin@greenfield.edu' })
    @IsEmail()
    contactEmail: string;

    @ApiProperty({ description: 'Owner user id', required: false })
    @IsOptional()
    @IsString()
    ownerId?: string;

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

    @ApiProperty({ description: 'Admin password', example: 'Str0ngP@ssw0rd!' })
    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    adminPassword: string;
}
