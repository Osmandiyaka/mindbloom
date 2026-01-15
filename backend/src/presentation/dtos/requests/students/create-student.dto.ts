import {
    IsString,
    IsEmail,
    IsOptional,
    IsDate,
    IsEnum,
    IsArray,
    ValidateNested,
    IsBoolean,
    ArrayMinSize
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class AddressDto {
    @ApiProperty()
    @IsString()
    street: string;

    @ApiProperty()
    @IsString()
    city: string;

    @ApiProperty()
    @IsString()
    state: string;

    @ApiProperty()
    @IsString()
    postalCode: string;

    @ApiProperty()
    @IsString()
    country: string;
}

class GuardianDto {
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    id?: string;

    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty({ enum: ['father', 'mother', 'guardian', 'sibling', 'grandparent', 'other'] })
    @IsEnum(['father', 'mother', 'guardian', 'sibling', 'grandparent', 'other'])
    relationship: string;

    @ApiProperty()
    @IsString()
    phone: string;

    @ApiProperty({ required: false })
    @IsEmail()
    @IsOptional()
    email?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    occupation?: string;

    @ApiProperty({ type: AddressDto, required: false })
    @ValidateNested()
    @Type(() => AddressDto)
    @IsOptional()
    address?: AddressDto;

    @ApiProperty()
    @IsBoolean()
    isPrimary: boolean;

    @ApiProperty()
    @IsBoolean()
    isEmergencyContact: boolean;
}

class MedicalInfoDto {
    @ApiProperty({ enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], required: false })
    @IsEnum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    @IsOptional()
    bloodGroup?: string;

    @ApiProperty({ type: [String], required: false })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    allergies?: string[];

    @ApiProperty({ type: [String], required: false })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    medicalConditions?: string[];

    @ApiProperty({ type: [String], required: false })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    medications?: string[];

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    doctorName?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    doctorPhone?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    insuranceProvider?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    insuranceNumber?: string;
}

class EnrollmentInfoDto {
    @ApiProperty()
    @IsString()
    admissionNumber: string;

    @ApiProperty()
    @IsDate()
    @Type(() => Date)
    admissionDate: Date;

    @ApiProperty()
    @IsString()
    academicYear: string;

    @ApiProperty()
    @IsString()
    class: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    section?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    rollNumber?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    previousSchool?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    previousClass?: string;
}

export class CreateStudentDto {
    @ApiProperty()
    @IsString()
    schoolId: string;
    @ApiProperty()
    @IsString()
    firstName: string;

    @ApiProperty()
    @IsString()
    lastName: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    middleName?: string;

    @ApiProperty()
    @IsDate()
    @Type(() => Date)
    dateOfBirth: Date;

    @ApiProperty({ enum: ['male', 'female', 'other'] })
    @IsEnum(['male', 'female', 'other'])
    gender: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    nationality?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    religion?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    caste?: string;

    @ApiProperty({ required: false })
    @IsEmail()
    @IsOptional()
    email?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    phone?: string;

    @ApiProperty({ type: AddressDto, required: false })
    @ValidateNested()
    @Type(() => AddressDto)
    @IsOptional()
    address?: AddressDto;

    @ApiProperty({ type: [GuardianDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => GuardianDto)
    @ArrayMinSize(1)
    guardians: GuardianDto[];

    @ApiProperty({ type: MedicalInfoDto, required: false })
    @ValidateNested()
    @Type(() => MedicalInfoDto)
    @IsOptional()
    medicalInfo?: MedicalInfoDto;

    @ApiProperty({ type: EnrollmentInfoDto })
    @ValidateNested()
    @Type(() => EnrollmentInfoDto)
    enrollment: EnrollmentInfoDto;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    photo?: string;

}
