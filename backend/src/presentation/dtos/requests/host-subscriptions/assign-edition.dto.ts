import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { AssignBehavior } from '../../../../domain/tenant/entities/tenant-subscription.types';

export class AssignEditionDto {
    @ApiProperty({ description: 'Edition ID to assign (nullable to remove)', required: false })
    @IsOptional()
    @IsString()
    editionId?: string | null;

    @ApiProperty({ description: 'Subscription end date (ISO)', required: false })
    @IsOptional()
    @IsDateString()
    subscriptionEndDate?: string | null;

    @ApiProperty({ enum: AssignBehavior })
    @IsEnum(AssignBehavior)
    behavior!: AssignBehavior;
}
