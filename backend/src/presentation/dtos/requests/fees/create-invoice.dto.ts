import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateInvoiceDto {
  @ApiProperty()
  @IsString()
  studentId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  studentName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  planId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  planName?: string;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsString()
  currency: string;

  @ApiProperty()
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  issuedDate?: string;

  @ApiPropertyOptional({ enum: ['draft', 'issued', 'paid', 'overdue', 'cancelled'] })
  @IsEnum(['draft', 'issued', 'paid', 'overdue', 'cancelled'])
  @IsOptional()
  status?: 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reference?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
