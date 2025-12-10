import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ListAcademicRecordsDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  exam?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  term?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  academicYear?: string;
}
