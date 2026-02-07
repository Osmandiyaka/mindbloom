import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type TenantDiscoveryMatch = 'none' | 'single' | 'multiple';

export class TenantDiscoveryTenantDto {
    @ApiProperty({ description: 'Tenant identifier (UUID)' })
    tenantId: string;

    @ApiPropertyOptional({ description: 'Tenant slug/subdomain' })
    tenantSlug?: string;

    @ApiProperty({ description: 'Friendly tenant name' })
    tenantName: string;

    @ApiPropertyOptional({ description: 'Branding logo URL' })
    logoUrl?: string;

    @ApiPropertyOptional({ type: [String], description: 'Allowed authentication methods for this tenant' })
    allowedAuthMethods?: string[];
}

export class TenantDiscoveryResponseDto {
    @ApiProperty({ enum: ['none', 'single', 'multiple'], description: 'Discovery match state' })
    match: TenantDiscoveryMatch;

    @ApiProperty({ type: [String], description: 'Authentication methods to show' })
    allowedAuthMethods: string[];

    @ApiPropertyOptional({ type: TenantDiscoveryTenantDto })
    tenant?: TenantDiscoveryTenantDto;

    @ApiPropertyOptional({ type: [TenantDiscoveryTenantDto] })
    tenants?: TenantDiscoveryTenantDto[];
}
