import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({ example: 'admin@mindbloom.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'admin123' })
    @IsString()
    @MinLength(6)
    password: string;

    @ApiProperty({ required: false, description: 'Optional tenant id to scope login for tenant users' })
    @IsOptional()
    @IsString()
    tenantId?: string | null;
}
