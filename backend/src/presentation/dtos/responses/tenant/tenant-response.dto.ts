import { ApiProperty } from '@nestjs/swagger';
import { Tenant } from '../../../../domain/tenant/entities/tenant.entity';

export class TenantResponseDto {
    @ApiProperty({ description: 'Tenant ID' })
    id: string;

    @ApiProperty({ description: 'Tenant name' })
    name: string;

    @ApiProperty({ description: 'Tenant subdomain/code' })
    subdomain: string;

    @ApiProperty({ description: 'Tenant status' })
    status: string;

    @ApiProperty({ description: 'Tenant plan' })
    plan: string;

    @ApiProperty({ description: 'Owner user id', required: false })
    ownerId?: string | null;

    @ApiProperty({ description: 'Contact email' })
    contactEmail: string;

    static fromDomain(tenant: Tenant): TenantResponseDto {
        return {
            id: tenant.id,
            name: tenant.name,
            subdomain: tenant.subdomain,
            status: tenant.status,
            plan: tenant.plan,
            ownerId: tenant.ownerId,
            contactEmail: tenant.contactInfo.email,
        };
    }
}
