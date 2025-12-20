import { ApiProperty } from '@nestjs/swagger';
import { Tenant } from '../../../../domain/tenant/entities/tenant.entity';
import { TenantListAggregates } from '../../../../application/services/tenant/list-tenants.use-case';

export class TenantListItemDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    subdomain: string;

    @ApiProperty({ required: false })
    customDomain?: string;

    @ApiProperty()
    status: string;

    @ApiProperty()
    edition: string;

    @ApiProperty({ required: false })
    trialEndsAt?: Date;

    @ApiProperty({ required: false })
    contactEmail?: string;

    @ApiProperty({ required: false })
    contactPhone?: string;

    @ApiProperty({ required: false })
    createdAt?: Date;

    @ApiProperty({ required: false })
    updatedAt?: Date;

    @ApiProperty({ type: Object })
    usage: {
        students: number;
        teachers: number;
        classes: number;
        storageMb: number;
    };

    @ApiProperty({ type: Object })
    limits: {
        maxStudents: number;
        maxTeachers: number;
        maxClasses: number;
        maxStorage?: number;
    };

    static fromDomain(tenant: Tenant): TenantListItemDto {
        return {
            id: tenant.id,
            name: tenant.name,
            subdomain: tenant.subdomain,
            customDomain: tenant.customization?.customDomain,
            status: tenant.status,
            edition: tenant.edition ?? tenant.plan,
            trialEndsAt: tenant.trialEndsAt,
            contactEmail: tenant.contactInfo.email,
            contactPhone: tenant.contactInfo.phone,
            createdAt: tenant.createdAt,
            updatedAt: tenant.updatedAt,
            usage: {
                students: tenant.usage?.currentStudents || 0,
                teachers: tenant.usage?.currentTeachers || 0,
                classes: tenant.usage?.currentClasses || 0,
                storageMb: tenant.usage?.currentStorage || 0,
            },
            limits: {
                maxStudents: tenant.limits?.maxStudents || 0,
                maxTeachers: tenant.limits?.maxTeachers || 0,
                maxClasses: tenant.limits?.maxClasses || 0,
                maxStorage: tenant.limits?.maxStorage,
            },
        };
    }
}

export class TenantListResponseDto {
    @ApiProperty({ type: [TenantListItemDto] })
    data: TenantListItemDto[];

    @ApiProperty()
    total: number;

    @ApiProperty()
    page: number;

    @ApiProperty()
    pageSize: number;

    @ApiProperty({ type: Object })
    aggregates: TenantListAggregates;
}
