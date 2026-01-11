import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class PublicTenantLookupQueryDto {
    @ApiPropertyOptional({ description: 'Search by name, subdomain, or custom domain' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ description: 'Max results (1-10)', default: 6, example: 6 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(10)
    limit?: number;
}
