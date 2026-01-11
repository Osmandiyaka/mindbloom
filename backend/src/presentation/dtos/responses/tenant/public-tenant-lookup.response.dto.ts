import { ApiProperty } from '@nestjs/swagger';
import { Tenant } from '../../../../domain/tenant/entities/tenant.entity';

export class PublicTenantLookupItemDto {
    @ApiProperty({ example: 'tenant_123' })
    id: string;

    @ApiProperty({ example: 'Northview District' })
    name: string;

    @ApiProperty({ example: 'northview' })
    subdomain: string;

    @ApiProperty({ example: 'northview.edu', required: false, nullable: true })
    customDomain?: string | null;

    static fromDomain(tenant: Tenant): PublicTenantLookupItemDto {
        return {
            id: tenant.id,
            name: tenant.name,
            subdomain: tenant.subdomain,
            customDomain: tenant.customization?.customDomain ?? null,
        };
    }
}
