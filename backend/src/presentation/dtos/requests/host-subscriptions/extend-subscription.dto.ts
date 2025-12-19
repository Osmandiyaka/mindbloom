import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class ExtendSubscriptionDto {
    @ApiProperty({ description: 'New subscription end date (ISO)' })
    @IsDateString()
    newEndDate!: string;
}
