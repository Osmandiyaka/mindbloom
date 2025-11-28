import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

export class CreateTenantDto {
    @ApiProperty({ description: 'Tenant name', example: 'Greenfield High School' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ description: 'Tenant subdomain/code', example: 'greenfield' })
    @IsString()
    @IsNotEmpty()
    subdomain: string;

    @ApiProperty({
        description: 'Tenant plan',
        enum: ['free', 'basic', 'premium', 'enterprise'],
        required: false,
        default: 'free'
    })
    @IsEnum(['free', 'basic', 'premium', 'enterprise'])
    @IsOptional()
    plan?: 'free' | 'basic' | 'premium' | 'enterprise';
}
