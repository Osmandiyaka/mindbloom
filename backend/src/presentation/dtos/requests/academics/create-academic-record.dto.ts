import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAcademicRecordDto {
  @ApiProperty()
  @IsString()
  subject: string;

  @ApiProperty()
  @IsString()
  exam: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  term?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  academicYear?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  class?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  section?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  score?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  grade?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  remarks?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  recordedAt?: string;

  @ApiProperty()
  @IsString()
  recordedBy: string;
}
