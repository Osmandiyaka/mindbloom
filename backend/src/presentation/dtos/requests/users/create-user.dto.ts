import { IsEmail, IsString, MinLength, IsOptional, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'John Doe' })
    @IsString()
    name: string;

    @ApiProperty({ example: 'Password123!', minLength: 8 })
    @IsString()
    @MinLength(8)
    password: string;

    @ApiProperty({ example: '507f1f77bcf86cd799439011', required: false })
    @IsOptional()
    @IsString()
    roleId?: string;

    @ApiProperty({ example: 'https://example.com/avatar.jpg', required: false })
    @IsOptional()
    @IsString()
    profilePicture?: string;

    @ApiProperty({ example: 'female', required: false })
    @IsOptional()
    @IsString()
    gender?: string;

    @ApiProperty({ example: '1998-06-10', required: false })
    @IsOptional()
    @IsDateString()
    dateOfBirth?: string;

    @ApiProperty({ example: '+233 20 000 0000', required: false })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiProperty({ example: true, required: false })
    @IsOptional()
    @IsBoolean()
    forcePasswordReset?: boolean;

    @ApiProperty({ example: true, required: false })
    @IsOptional()
    @IsBoolean()
    mfaEnabled?: boolean;
}
