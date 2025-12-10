import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class RecordPaymentDto {
  @ApiProperty()
  @IsString()
  invoiceId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  studentId?: string;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsString()
  currency: string;

  @ApiProperty({ enum: ['cash', 'card', 'transfer', 'online', 'other'] })
  @IsEnum(['cash', 'card', 'transfer', 'online', 'other'])
  method: 'cash' | 'card' | 'transfer' | 'online' | 'other';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reference?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ enum: ['completed', 'pending', 'failed'] })
  @IsEnum(['completed', 'pending', 'failed'])
  @IsOptional()
  status?: 'completed' | 'pending' | 'failed';

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  paidAt?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  recordedBy?: string;
}
