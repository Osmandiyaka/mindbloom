import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class DeleteOrgUnitDto {
    @ApiProperty({ required: false, example: 'Finance' })
    @IsOptional()
    @IsString()
    confirmationText?: string;
}
