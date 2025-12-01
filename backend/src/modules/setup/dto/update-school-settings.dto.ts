import { Type } from 'class-transformer';
import { IsArray, IsDate, IsOptional, IsString, ValidateNested } from 'class-validator';

class AcademicYearDto {
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    start?: Date;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    end?: Date;
}

class GradingSchemeDto {
    @IsOptional()
    @IsString()
    type?: string;

    @IsOptional()
    passThreshold?: number;
}

class NamedCodeDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    code?: string;
}

class GradeDto extends NamedCodeDto {
    @IsOptional()
    @IsString()
    level?: string;
}

export class UpdateSchoolSettingsDto {
    @IsOptional()
    @IsString()
    schoolName?: string;

    @IsOptional()
    @IsString()
    domain?: string;

    @IsOptional()
    @IsString()
    addressLine1?: string;

    @IsOptional()
    @IsString()
    addressLine2?: string;

    @IsOptional()
    @IsString()
    city?: string;

    @IsOptional()
    @IsString()
    state?: string;

    @IsOptional()
    @IsString()
    postalCode?: string;

    @IsOptional()
    @IsString()
    country?: string;

    @IsOptional()
    @IsString()
    timezone?: string;

    @IsOptional()
    @IsString()
    locale?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => AcademicYearDto)
    academicYear?: AcademicYearDto;

    @IsOptional()
    @IsString()
    contactEmail?: string;

    @IsOptional()
    @IsString()
    contactPhone?: string;

    @IsOptional()
    @IsString()
    website?: string;

    @IsOptional()
    @IsString()
    logoUrl?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => GradingSchemeDto)
    gradingScheme?: GradingSchemeDto;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => NamedCodeDto)
    departments?: NamedCodeDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => GradeDto)
    grades?: GradeDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => NamedCodeDto)
    subjects?: NamedCodeDto[];
}
