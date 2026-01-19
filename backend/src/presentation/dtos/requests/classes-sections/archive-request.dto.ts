import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ArchiveRequestDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    confirmationText?: string;
}
