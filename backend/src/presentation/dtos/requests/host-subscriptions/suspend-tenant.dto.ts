import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class SuspendTenantDto {
    @ApiProperty({ description: 'Reason for suspension' })
    @IsString()
    @Length(1, 512)
    reason!: string;
}
