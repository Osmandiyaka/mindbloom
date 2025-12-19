import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsString } from 'class-validator';
import { ProrationPolicy } from '../../../../domain/tenant/entities/tenant-subscription.types';

export class ChangeEditionDto {
    @ApiProperty({ description: 'New edition ID' })
    @IsString()
    editionId!: string;

    @ApiProperty({ description: 'Effective date (ISO)' })
    @IsDateString()
    effectiveDate!: string;

    @ApiProperty({ enum: ProrationPolicy })
    @IsEnum(ProrationPolicy)
    prorationPolicy!: ProrationPolicy;
}
