import { ApiProperty } from '@nestjs/swagger';
import { Tenant } from '../../../../domain/tenant/entities/tenant.entity';

export class TenantResponseDto {
    @ApiProperty({ description: 'Tenant ID' })
    id: string;

    @ApiProperty({ description: 'Tenant name' })
    name: string;

    @ApiProperty({ description: 'Tenant subdomain/code' })
    subdomain: string;

    @ApiProperty({ description: 'Generated school identifier' })
    schoolId: string;

    @ApiProperty({ description: 'Tenant status' })
    status: string;

    @ApiProperty({ description: 'Tenant plan' })
    plan: string;

    @ApiProperty({ description: 'Locale' })
    locale: string;

    @ApiProperty({ description: 'Timezone' })
    timezone: string;

    @ApiProperty({ description: 'Week start' })
    weekStartsOn: string;

    @ApiProperty({ description: 'Academic year settings', required: false })
    academicYear?: { start: Date; end: Date; name?: string };

    @ApiProperty({ description: 'Resource limits' })
    limits: {
        maxStudents: number;
        maxTeachers: number;
        maxClasses: number;
        maxAdmins?: number;
        maxStorage?: number;
        maxBandwidth?: number;
    };

    @ApiProperty({ description: 'Whether initial configuration is required', required: false })
    initialConfigRequired?: boolean;

    @ApiProperty({ description: 'Owner user id', required: false })
    ownerId?: string | null;

    @ApiProperty({ description: 'Contact email' })
    contactEmail: string;

    @ApiProperty({ description: 'Contact phone', required: false })
    contactPhone?: string;

    @ApiProperty({ description: 'School address', required: false })
    address?: Record<string, any>;

    @ApiProperty({ description: 'Logo url', required: false })
    logo?: string;

    static fromDomain(tenant: Tenant): TenantResponseDto {
        return {
            id: tenant.id,
            name: tenant.name,
            subdomain: tenant.subdomain,
            status: tenant.status,
            plan: tenant.plan,
            ownerId: tenant.ownerId,
            contactEmail: tenant.contactInfo.email,
            contactPhone: tenant.contactInfo.phone,
            address: tenant.contactInfo.address,
            logo: tenant.customization?.logo,
            schoolId: tenant.metadata?.schoolId,
            locale: tenant.locale,
            timezone: tenant.timezone,
            weekStartsOn: tenant.weekStartsOn,
            academicYear: tenant.academicYear,
            initialConfigRequired: tenant.metadata?.initialConfigRequired,
            limits: tenant.limits,
        };
    }
}
