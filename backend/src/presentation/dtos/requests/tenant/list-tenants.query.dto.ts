import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { TenantStatus } from '../../../../domain/tenant/entities/tenant.entity';

const toArray = (value: any): string[] => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return value.split(',').map((v) => v.trim()).filter(Boolean);
    return [];
};

export class ListTenantsQueryDto {
    @ApiPropertyOptional({ description: 'Search by name, subdomain, contact email, or custom domain' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ description: 'Filter by status', enum: TenantStatus, isArray: true })
    @IsOptional()
    @Transform(({ value }) => toArray(value))
    statuses?: TenantStatus[];

    @ApiPropertyOptional({ description: 'Filter by edition code', isArray: true })
    @IsOptional()
    @Transform(({ value }) => toArray(value))
    editions?: string[];

    @ApiPropertyOptional({ description: 'Trials expiring within N days (default 14)', example: 14 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    trialExpiringInDays?: number;

    @ApiPropertyOptional({ description: 'Page number (1-based)', example: 1, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    page?: number;

    @ApiPropertyOptional({ description: 'Page size', example: 20, default: 20 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    pageSize?: number;

    @ApiPropertyOptional({ description: 'Sort field', enum: ['createdAt', 'name', 'status', 'edition'], default: 'createdAt' })
    @IsOptional()
    @IsString()
    sortBy?: 'createdAt' | 'name' | 'status' | 'edition';

    @ApiPropertyOptional({ description: 'Sort direction', enum: ['asc', 'desc'], default: 'desc' })
    @IsOptional()
    @IsIn(['asc', 'desc'])
    sortDirection?: 'asc' | 'desc';
}
