import { IsString, IsEmail, IsNotEmpty, IsOptional, IsDateString, IsArray, ValidateNested, IsBoolean, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

class AddressDto {
    @IsString()
    @IsNotEmpty()
    street: string;

    @IsString()
    @IsNotEmpty()
    city: string;

    @IsString()
    @IsNotEmpty()
    state: string;

    @IsString()
    @IsNotEmpty()
    postalCode: string;

    @IsString()
    @IsNotEmpty()
    country: string;
}

class GuardianDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    @IsEnum(['father', 'mother', 'guardian', 'other'])
    relationship: string;

    @IsString()
    @IsNotEmpty()
    phone: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    occupation?: string;

    @ValidateNested()
    @Type(() => AddressDto)
    @IsOptional()
    address?: AddressDto;

    @IsBoolean()
    isPrimary: boolean;
}

class PreviousSchoolDto {
    @IsString()
    @IsNotEmpty()
    schoolName: string;

    @IsString()
    @IsOptional()
    grade?: string;

    @IsString()
    @IsOptional()
    yearLeft?: string;

    @IsString()
    @IsOptional()
    reasonForLeaving?: string;
}

export class CreateApplicationDto {
    @IsString()
    @IsNotEmpty()
    @IsEnum(['online', 'walk_in', 'referral', 'agent'])
    source: string;

    // Personal Information
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @IsString()
    @IsNotEmpty()
    lastName: string;

    @IsString()
    @IsOptional()
    middleName?: string;

    @IsDateString()
    @IsNotEmpty()
    dateOfBirth: string;

    @IsString()
    @IsNotEmpty()
    @IsEnum(['male', 'female', 'other'])
    gender: string;

    @IsString()
    @IsOptional()
    nationality?: string;

    @IsString()
    @IsOptional()
    religion?: string;

    @IsString()
    @IsOptional()
    bloodGroup?: string;

    // Contact
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    phone: string;

    @ValidateNested()
    @Type(() => AddressDto)
    @IsOptional()
    address?: AddressDto;

    // Guardians
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => GuardianDto)
    @IsNotEmpty()
    guardians: GuardianDto[];

    // Academic
    @IsString()
    @IsNotEmpty()
    gradeApplying: string;

    @IsString()
    @IsNotEmpty()
    academicYear: string;

    @ValidateNested()
    @Type(() => PreviousSchoolDto)
    @IsOptional()
    previousSchool?: PreviousSchoolDto;

    // Additional
    @IsString()
    @IsOptional()
    personalStatement?: string;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsNumber()
    @IsOptional()
    applicationFeeAmount?: number;

    @IsBoolean()
    @IsOptional()
    applicationFeePaid?: boolean;
}
