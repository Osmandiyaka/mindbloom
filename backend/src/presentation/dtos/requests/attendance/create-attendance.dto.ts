import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateAttendanceDto {
  @ApiProperty()
  @IsString()
  studentId: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  class?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  section?: string;

  @ApiProperty()
  @IsDateString()
  date: string;

  @ApiProperty({ enum: ['present', 'absent', 'late', 'excused'] })
  @IsEnum(['present', 'absent', 'late', 'excused'])
  status: 'present' | 'absent' | 'late' | 'excused';

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiProperty()
  @IsString()
  recordedBy: string;
}
