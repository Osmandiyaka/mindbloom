import { IsArray, IsBoolean, IsEmail, IsOptional, IsString, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UserSchoolAccessInput } from './user-school-access.input';

export class CreateUserInput {
    @IsString()
    tenantId!: string;

    @IsEmail()
    email!: string;

    @IsOptional()
    @IsString()
    name?: string;

    @IsString()
    @MinLength(8)
    password!: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    roleIds?: string[];

    @ValidateNested()
    @Type(() => UserSchoolAccessInput)
    @IsOptional()
    schoolAccess?: UserSchoolAccessInput;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    profilePicture?: string;

    @IsOptional()
    @IsString()
    gender?: string;

    @IsOptional()
    @IsString()
    dateOfBirth?: string;

    @IsOptional()
    @IsBoolean()
    forcePasswordReset?: boolean;

    @IsOptional()
    @IsBoolean()
    mfaEnabled?: boolean;

    @IsOptional()
    @IsString()
    status?: 'active' | 'suspended' | 'invited';
}
