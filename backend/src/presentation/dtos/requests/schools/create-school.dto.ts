import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional, IsString, MinLength } from 'class-validator';
import { SchoolAddress, SchoolContact, SchoolSettings, SchoolStatus, SchoolType } from '../../../../domain/school/entities/school.entity';

export class CreateSchoolDto {
    @ApiProperty({ description: 'School name' })
    @IsString()
    @MinLength(2)
    name!: string;

    @ApiPropertyOptional({ description: 'School code (auto-generated if omitted)' })
    @IsOptional()
    @IsString()
    code?: string;

    @ApiPropertyOptional({ enum: SchoolType, description: 'School type' })
    @IsOptional()
    @IsEnum(SchoolType)
    type?: SchoolType;

    @ApiPropertyOptional({ enum: SchoolStatus, description: 'School status' })
    @IsOptional()
    @IsEnum(SchoolStatus)
    status?: SchoolStatus;

    @ApiPropertyOptional({ description: 'Primary domain or website' })
    @IsOptional()
    @IsString()
    domain?: string;

    @ApiPropertyOptional({ description: 'School address' })
    @IsOptional()
    @IsObject()
    address?: SchoolAddress;

    @ApiPropertyOptional({ description: 'School contact information' })
    @IsOptional()
    @IsObject()
    contact?: SchoolContact;

    @ApiPropertyOptional({ description: 'School settings' })
    @IsOptional()
    @IsObject()
    settings?: SchoolSettings;
}
