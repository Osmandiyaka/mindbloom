import { ApiProperty } from '@nestjs/swagger';
import { Tenant } from '../../../../domain/tenant/entities/tenant.entity';

export class TenantResponseDto {
    @ApiProperty({ description: 'Tenant ID' })
    id: string;

    @ApiProperty({ description: 'Tenant name' })
    name: string;

    @ApiProperty({ description: 'Tenant subdomain/code' })
    subdomain: string;

    @ApiProperty({ description: 'Tenant status', enum: ['active', 'suspended', 'inactive'] })
    status: 'active' | 'suspended' | 'inactive';

    @ApiProperty({ description: 'Tenant plan', enum: ['free', 'basic', 'premium', 'enterprise'] })
    plan: 'free' | 'basic' | 'premium' | 'enterprise';

    static fromDomain(tenant: Tenant): TenantResponseDto {
        return {
            id: tenant.id,
            name: tenant.name,
            subdomain: tenant.subdomain,
            status: tenant.status,
            plan: tenant.plan,
        };
    }
}
