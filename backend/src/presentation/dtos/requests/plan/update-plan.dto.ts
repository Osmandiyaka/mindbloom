import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { BillingInterval, PlanStatus } from '../../../../domain/subscription/entities/plan.entity';
import { PlanModuleDto } from './plan-module.dto';

export class UpdatePlanDto {
    @ApiPropertyOptional({ description: 'Plan name' })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({ description: 'Marketing description' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ description: 'Plan status', enum: PlanStatus })
    @IsOptional()
    @IsEnum(PlanStatus)
    status?: PlanStatus;

    @ApiPropertyOptional({ description: 'Currency code', example: 'USD' })
    @IsOptional()
    @IsString()
    currency?: string;

    @ApiPropertyOptional({ description: 'Price amount', example: 99 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    priceAmount?: number;

    @ApiPropertyOptional({ description: 'Billing interval', enum: BillingInterval })
    @IsOptional()
    @IsEnum(BillingInterval)
    billingInterval?: BillingInterval;

    @ApiPropertyOptional({ type: [PlanModuleDto] })
    @IsOptional()
    @Type(() => PlanModuleDto)
    modules?: PlanModuleDto[];
}
