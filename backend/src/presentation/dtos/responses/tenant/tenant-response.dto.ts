import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

    @ApiPropertyOptional({ description: 'Tenant edition id (preferred)' })
    editionId?: string;

    @ApiProperty({ description: 'Tenant edition code' })
    edition: string;

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

    @ApiProperty({ description: 'Subscription end date', required: false })
    subscriptionEndDate?: Date | null;

    @ApiProperty({ description: 'Contact phone', required: false })
    contactPhone?: string;

    @ApiProperty({ description: 'School address', required: false })
    address?: Record<string, any>;

    @ApiProperty({ description: 'Logo url', required: false })
    logo?: string;

    @ApiProperty({ description: 'Favicon url', required: false })
    favicon?: string;

    @ApiProperty({ description: 'Primary color', required: false })
    primaryColor?: string;

    @ApiProperty({ description: 'Secondary color', required: false })
    secondaryColor?: string;

    @ApiProperty({ description: 'Accent color', required: false })
    accentColor?: string;

    @ApiProperty({ description: 'Custom domain', required: false })
    customDomain?: string;

    static fromDomain(tenant: Tenant): TenantResponseDto {
        return {
            id: tenant.id,
            name: tenant.name,
            subdomain: tenant.subdomain,
            status: tenant.status,
            editionId: tenant.editionId ?? undefined,
            edition: tenant.editionId ?? tenant.metadata?.editionCode ?? 'free',
            ownerId: tenant.ownerId,
            contactEmail: tenant.contactInfo.email,
            contactPhone: tenant.contactInfo.phone,
            address: tenant.contactInfo.address,
            logo: tenant.customization?.logo,
            favicon: tenant.customization?.favicon,
            primaryColor: tenant.customization?.primaryColor,
            secondaryColor: tenant.customization?.secondaryColor,
            accentColor: tenant.customization?.accentColor,
            customDomain: tenant.customization?.customDomain,
            schoolId: tenant.metadata?.schoolId,
            locale: tenant.locale,
            timezone: tenant.timezone,
            weekStartsOn: tenant.weekStartsOn,
            academicYear: tenant.academicYear,
            initialConfigRequired: tenant.metadata?.initialConfigRequired,
            subscriptionEndDate: tenant.subscriptionEndDate ?? null,
            limits: tenant.limits,
        };
    }
}
