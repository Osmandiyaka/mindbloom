import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsEmail } from 'class-validator';

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
}
