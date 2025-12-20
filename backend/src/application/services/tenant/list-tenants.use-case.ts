import { Inject, Injectable } from '@nestjs/common';
import { ITenantRepository, TenantListQuery, TenantUsageTotals, TENANT_REPOSITORY, TenantStatusCounts } from '../../../domain/ports/out/tenant-repository.port';
import { Tenant, TenantPlan, TenantStatus } from '../../../domain/tenant/entities/tenant.entity';

export interface TenantListAggregates {
    total: number;
    active: number;
    suspended: number;
    trial: number;
    trialExpiring: number;
    usageTotals: {
        students: number;
        teachers: number;
        classes: number;
        storageMb: number;
    };
}

export interface TenantListResultDto {
    data: Tenant[];
    total: number;
    page: number;
    pageSize: number;
    aggregates: TenantListAggregates;
}

@Injectable()
export class ListTenantsUseCase {
    constructor(
        @Inject(TENANT_REPOSITORY) private readonly tenantRepository: ITenantRepository,
    ) { }

    async execute(query: TenantListQuery): Promise<TenantListResultDto> {
        const page = query.page || 1;
        const pageSize = query.pageSize || 20;
        const expiringWindow = query.trialExpiringBefore || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

        const { data, total, usageTotals, statusCounts } = await this.tenantRepository.findWithFilters({
            ...query,
            page,
            pageSize,
            trialExpiringBefore: query.trialExpiringBefore,
        });

        const aggregates = this.buildAggregates(data, expiringWindow, total, usageTotals, statusCounts);

        return {
            data,
            total,
            page,
            pageSize,
            aggregates,
        };
    }

    private buildAggregates(tenants: Tenant[], expiringWindow: Date, total: number, usageTotals?: TenantUsageTotals, statusCounts?: TenantStatusCounts): TenantListAggregates {
        const aggregateUsage = usageTotals || tenants.reduce((acc, tenant) => {
            acc.students += tenant.usage?.currentStudents || 0;
            acc.teachers += tenant.usage?.currentTeachers || 0;
            acc.classes += tenant.usage?.currentClasses || 0;
            acc.storageMb += tenant.usage?.currentStorage || 0;
            return acc;
        }, { students: 0, teachers: 0, classes: 0, storageMb: 0 });

        const counts = statusCounts || {
            active: tenants.filter((t) => t.status === TenantStatus.ACTIVE).length,
            suspended: tenants.filter((t) => t.status === TenantStatus.SUSPENDED).length,
            trial: tenants.filter((t) => (t.metadata?.editionCode ?? t.plan) === TenantPlan.TRIAL).length,
            trialExpiring: tenants.filter((t) => (t.metadata?.editionCode ?? t.plan) === TenantPlan.TRIAL && !!t.trialEndsAt && t.trialEndsAt <= expiringWindow).length,
        };

        return {
            total,
            active: counts.active,
            suspended: counts.suspended,
            trial: counts.trial,
            trialExpiring: counts.trialExpiring,
            usageTotals: aggregateUsage,
        };
    }
}
