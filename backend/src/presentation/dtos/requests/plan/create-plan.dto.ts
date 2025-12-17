import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';
import { BillingInterval, PlanStatus } from '../../../../domain/subscription/entities/plan.entity';
import { PlanModuleDto } from './plan-module.dto';

export class CreatePlanDto {
    @ApiProperty({ description: 'Plan name', example: 'Premium' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ description: 'Marketing description' })
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiPropertyOptional({ description: 'Plan status', enum: PlanStatus, default: PlanStatus.ACTIVE })
    @IsOptional()
    @IsEnum(PlanStatus)
    status?: PlanStatus;

    @ApiProperty({ description: 'Currency code', example: 'USD' })
    @IsString()
    @IsNotEmpty()
    currency: string;

    @ApiProperty({ description: 'Price amount', example: 99 })
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    priceAmount: number;

    @ApiProperty({ description: 'Billing interval', enum: BillingInterval })
    @IsEnum(BillingInterval)
    billingInterval: BillingInterval;

    @ApiProperty({ type: [PlanModuleDto] })
    @Type(() => PlanModuleDto)
    modules: PlanModuleDto[];
}
