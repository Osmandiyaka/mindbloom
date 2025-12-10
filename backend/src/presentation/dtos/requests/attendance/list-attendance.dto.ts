import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class ListAttendanceDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  studentId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  class?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  section?: string;

  @ApiPropertyOptional({ enum: ['present', 'absent', 'late', 'excused'] })
  @IsEnum(['present', 'absent', 'late', 'excused'])
  @IsOptional()
  status?: 'present' | 'absent' | 'late' | 'excused';

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dateTo?: string;
}
