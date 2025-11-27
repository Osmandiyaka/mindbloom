import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsEmail, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

class AdmissionDocumentDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    type: string;

    @IsString()
    @IsOptional()
    url?: string;
}

export class CreateAdmissionDto {
    @IsString()
    @IsNotEmpty()
    applicantName: string;

    @IsString()
    @IsNotEmpty()
    gradeApplying: string;

    @IsEmail()
    email: string;

    @IsString()
    @IsNotEmpty()
    phone: string;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AdmissionDocumentDto)
    @IsOptional()
    documents?: AdmissionDocumentDto[];

    @IsString()
    @IsOptional()
    tenantId?: string;
}
