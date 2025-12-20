import { Inject, Injectable, Logger, Scope, Optional } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { EditionManager } from '../subscription/edition-manager.service';
import { ITenantRepository, TENANT_REPOSITORY } from '../../../domain/ports/out/tenant-repository.port';
import { AssignBehavior, ProrationPolicy } from '../../../domain/tenant/entities/tenant-subscription.types';
import { Tenant } from '../../../domain/tenant/entities/tenant.entity';
import { AuditService } from '../audit/audit.service';
import {
    EditionNotFoundException,
    InvalidEffectiveDateException,
    InvalidSubscriptionEndDateException,
    InvalidSuspensionReasonException,
    ReactivationNotAllowedException,
    ScheduledChangeNotSupportedException,
    TenantNotFoundException,
} from '../../../domain/exceptions/tenant-subscription.exception';
import { EventBus, PlatformEvent } from '../../../core/plugins/event-bus.service';

interface AuditSnapshot {
    editionId: string | null | undefined;
    subscriptionEndDate?: Date | null;
    isSuspended?: boolean;
    gracePeriodEndDate?: Date | null;
}

interface ActorContext {
    userId: string | null;
    roleName: string | null;
    actorTenantContext: 'host' | 'tenant';
}

@Injectable({ scope: Scope.REQUEST })
export class TenantManager {
    private readonly logger = new Logger(TenantManager.name);

    constructor(
        @Inject(TENANT_REPOSITORY) private readonly tenants: ITenantRepository,
        private readonly editionManager: EditionManager,
        private readonly events: EventBus,
        @Inject(REQUEST) private readonly request: any,
        @Optional() private readonly audit?: AuditService,
    ) { }

    async assignEditionToTenant(
        tenantId: string,
        editionId: string | null,
        subscriptionEndDate: Date | null,
        behavior: AssignBehavior,
    ): Promise<void> {
        const tenant = await this.requireTenant(tenantId);
        const before = this.snapshot(tenant);

        if (behavior === AssignBehavior.SCHEDULED) {
            throw new ScheduledChangeNotSupportedException('Scheduled edition assignments are not supported yet.');
        }

        if (editionId) {
            try {
                await this.editionManager.getEditionWithFeatures(editionId);
            } catch (error) {
                throw new EditionNotFoundException(editionId);
            }
        }

        const normalizedEndDate = subscriptionEndDate ? new Date(subscriptionEndDate) : null;
        if (normalizedEndDate && Number.isNaN(normalizedEndDate.getTime())) {
            throw new InvalidSubscriptionEndDateException('Subscription end date is invalid.');
        }
        if (normalizedEndDate && normalizedEndDate < new Date() && behavior !== AssignBehavior.EXPIRED_ASSIGNMENT) {
            throw new InvalidSubscriptionEndDateException('Subscription end date cannot be in the past unless explicitly marked as expired.');
        }

        const updated = await this.tenants.update(tenant.id, {
            editionId: editionId ?? null,
            subscriptionEndDate: normalizedEndDate,
            isSuspended: behavior === AssignBehavior.KEEP_SUSPENSION ? tenant.isSuspended : false,
            gracePeriodEndDate: behavior === AssignBehavior.KEEP_SUSPENSION ? tenant.gracePeriodEndDate ?? null : null,
        } as Tenant);

        this.emitTenantAuditEvent(
            'TenantEditionAssigned',
            tenantId,
            before,
            this.snapshot(updated),
            {
                behavior,
                editionId,
                subscriptionEndDate: normalizedEndDate,
            },
        );

        // record audit log via AuditService (best-effort)
        void (this.audit?.log?.({
            category: 'TENANT_MGMT',
            action: 'TENANT.ASSIGN_EDITION',
            scope: 'HOST',
            tenantId: tenantId,
            actorType: this.getActor().actorTenantContext === 'host' ? 'HOST_USER' : 'TENANT_USER',
            actorUserId: this.getActor().userId ?? undefined,
            actorEmailSnapshot: (this.request?.user as any)?.email ?? undefined,
            message: `Assigned edition ${editionId} to tenant ${tenantId}`,
            before: before,
            after: this.snapshot(updated),
        }));
    }

    async extendSubscription(tenantId: string, newEndDate: Date): Promise<void> {
        const tenant = await this.requireTenant(tenantId);
        const before = this.snapshot(tenant);
        const target = new Date(newEndDate);

        if (Number.isNaN(target.getTime())) {
            throw new InvalidSubscriptionEndDateException('New subscription end date is invalid.');
        }

        if (tenant.subscriptionEndDate) {
            if (target <= tenant.subscriptionEndDate) {
                throw new InvalidSubscriptionEndDateException('New subscription end date must be after the current end date.');
            }
        } else if (target <= new Date()) {
            throw new InvalidSubscriptionEndDateException('New subscription end date must be in the future.');
        }

        const updated = await this.tenants.update(tenant.id, {
            subscriptionEndDate: target,
        } as Tenant);

        this.emitTenantAuditEvent(
            'TenantSubscriptionExtended',
            tenantId,
            before,
            this.snapshot(updated),
            {
                previousEndDate: before.subscriptionEndDate,
                newEndDate: target,
            },
        );
    }

    async changeEdition(
        tenantId: string,
        newEditionId: string,
        effectiveDate: Date,
        prorationPolicy: ProrationPolicy,
    ): Promise<void> {
        const tenant = await this.requireTenant(tenantId);
        const before = this.snapshot(tenant);

        try {
            await this.editionManager.getEditionWithFeatures(newEditionId);
        } catch (error) {
            throw new EditionNotFoundException(newEditionId);
        }

        const effective = new Date(effectiveDate);
        if (Number.isNaN(effective.getTime())) {
            throw new InvalidEffectiveDateException('Effective date is invalid.');
        }

        if (effective > new Date()) {
            throw new ScheduledChangeNotSupportedException('Scheduled plan changes are not enabled yet.');
        }

        const updated = await this.tenants.update(tenant.id, {
            editionId: newEditionId,
        } as Tenant);

        this.emitTenantAuditEvent(
            'TenantEditionChanged',
            tenantId,
            before,
            this.snapshot(updated),
            {
                previousEditionId: before.editionId,
                newEditionId,
                effectiveDate: effective,
                prorationPolicy,
            },
        );

        this.events.publish(PlatformEvent.SUBSCRIPTION_PLAN_CHANGED, {
            tenantId,
            previousState: tenant.subscriptionState,
            newState: updated.subscriptionState,
            subscriptionEndDate: updated.subscriptionEndDate,
            gracePeriodEndDate: updated.gracePeriodEndDate,
            previousEditionId: before.editionId,
            newEditionId,
            effectiveDate: effective,
            timestamp: new Date(),
        }, tenantId);
    }

    async suspendTenant(tenantId: string, reason: string): Promise<void> {
        const tenant = await this.requireTenant(tenantId);
        const before = this.snapshot(tenant);
        const trimmedReason = reason?.trim();

        if (!trimmedReason || trimmedReason.length === 0 || trimmedReason.length > 512) {
            throw new InvalidSuspensionReasonException('Suspension reason must be between 1 and 512 characters.');
        }

        const now = new Date();
        const updated = await this.tenants.update(tenant.id, {
            isSuspended: true,
            gracePeriodEndDate: now,
            suspensionReason: trimmedReason,
        } as Tenant);

        this.emitTenantAuditEvent(
            'TenantSuspended',
            tenantId,
            before,
            this.snapshot(updated),
            { reason: trimmedReason },
        );
    }

    async reactivateTenant(tenantId: string): Promise<void> {
        const tenant = await this.requireTenant(tenantId);
        const before = this.snapshot(tenant);
        const now = new Date();

        const actor = this.getActor();
        const hasValidSubscription = !tenant.subscriptionEndDate || tenant.subscriptionEndDate > now;
        const hostOverride = !!tenant.editionId && this.isHostActor(actor.roleName);

        if (!hasValidSubscription && !hostOverride) {
            throw new ReactivationNotAllowedException('Subscription expired; reactivation requires a valid subscription or host override.');
        }

        const updated = await this.tenants.update(tenant.id, {
            isSuspended: false,
            gracePeriodEndDate: null,
        } as Tenant);

        this.emitTenantAuditEvent(
            'TenantReactivated',
            tenantId,
            before,
            this.snapshot(updated),
            { hostOverride },
        );
    }

    private snapshot(tenant: Tenant): AuditSnapshot {
        return {
            editionId: tenant.editionId ?? null,
            subscriptionEndDate: tenant.subscriptionEndDate ?? null,
            isSuspended: tenant.isSuspended ?? false,
            gracePeriodEndDate: tenant.gracePeriodEndDate ?? null,
        };
    }

    private async requireTenant(tenantId: string): Promise<Tenant> {
        const tenant = await this.tenants.findById(tenantId);
        if (!tenant) {
            throw new TenantNotFoundException(tenantId);
        }
        return tenant;
    }

    private emitTenantAuditEvent(
        action: string,
        tenantId: string,
        before: AuditSnapshot,
        after: AuditSnapshot,
        metadata?: Record<string, any>,
    ): void {
        const actor = this.getActor();
        const payload = {
            action,
            targetTenantId: tenantId,
            actorUserId: actor.userId,
            actorTenantContext: actor.actorTenantContext,
            timestamp: new Date().toISOString(),
            before,
            after,
            metadata: metadata || {},
        };

        // TODO: replace logger with real audit sink when available
        this.logger.log(JSON.stringify(payload));
    }

    private getActor(): ActorContext {
        const user = this.request?.user || {};
        const roleName = user.roleName || null;
        const actorTenantContext: 'host' | 'tenant' = this.isHostActor(roleName) ? 'host' : 'tenant';
        return {
            userId: user.userId || null,
            roleName,
            actorTenantContext,
        };
    }

    private isHostActor(roleName: string | null): boolean {
        if (!roleName) return false;
        return roleName.toLowerCase().includes('host');
    }
}
