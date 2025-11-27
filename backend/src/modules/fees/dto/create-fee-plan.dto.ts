import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateFeePlanDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @Min(0)
    amount: number;

    @IsEnum(['one-time', 'monthly', 'term'])
    frequency: 'one-time' | 'monthly' | 'term';

    @IsString()
    @IsOptional()
    currency?: string;

    @IsString()
    @IsOptional()
    tenantId?: string;
}
