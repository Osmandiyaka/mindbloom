import { IsEmail, IsString, MinLength, IsOptional, IsBoolean, IsArray, IsIn, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class SchoolAccessDto {
    @ApiProperty({ example: 'all', enum: ['all', 'selected'] })
    @IsIn(['all', 'selected'])
    scope!: 'all' | 'selected';

    @ApiProperty({ example: ['school-1', 'school-2'], required: false, type: [String] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    schoolIds?: string[];
}

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

    @ApiProperty({ example: ['507f1f77bcf86cd799439011'], required: false, type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    roleIds?: string[];

    @ApiProperty({ required: false, type: SchoolAccessDto })
    @ValidateNested()
    @Type(() => SchoolAccessDto)
    @IsOptional()
    schoolAccess?: SchoolAccessDto;

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
    @IsString()
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

    @ApiProperty({ example: 'active', required: false, enum: ['active', 'suspended', 'invited'] })
    @IsOptional()
    @IsIn(['active', 'suspended', 'invited'])
    status?: 'active' | 'suspended' | 'invited';
}
