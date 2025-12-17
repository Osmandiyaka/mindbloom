import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsString } from 'class-validator';
import { MODULE_KEYS } from '../../../../domain/subscription/entities/plan.entity';

export class PlanModuleDto {
    @ApiProperty({ enum: MODULE_KEYS })
    @IsString()
    @IsIn(MODULE_KEYS)
    moduleKey: string;

    @ApiProperty({ default: true })
    @IsBoolean()
    enabled: boolean;
}
