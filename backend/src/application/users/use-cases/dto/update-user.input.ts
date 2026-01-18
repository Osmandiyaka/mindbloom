import { IsArray, IsBoolean, IsEmail, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UserSchoolAccessInput } from './user-school-access.input';

export class UpdateUserInput {
    @IsString()
    tenantId!: string;

    @IsString()
    userId!: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    name?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    roleIds?: string[];

    @IsOptional()
    @ValidateNested()
    @Type(() => UserSchoolAccessInput)
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
