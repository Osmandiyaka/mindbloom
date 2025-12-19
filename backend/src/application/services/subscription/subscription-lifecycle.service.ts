import { Inject, Injectable, Logger } from '@nestjs/common';
import { ITenantRepository, TENANT_REPOSITORY } from '../../../domain/ports/out/tenant-repository.port';
import { Tenant, SubscriptionState, TenantStatus } from '../../../domain/tenant/entities/tenant.entity';
import { TenantNotFoundException, ReactivationNotAllowedException } from '../../../domain/exceptions/tenant-subscription.exception';
import { EffectiveFeatureResolver } from '../features/effective-feature-resolver.service';
import { EventBus, PlatformEvent } from '../../../core/plugins/event-bus.service';

interface InitializeParams {
    mode: 'trial' | 'active';
    trialEndDate?: Date;
    subscriptionEndDate?: Date;
    editionId?: string | null;
}

interface PaymentSuccessPayload {
    paidThroughDate: Date;
    invoiceId?: string;
    paymentId?: string;
}

interface PaymentFailurePayload {
    failedAt: Date;
    invoiceId?: string;
    reasonCode?: string;
}

interface HostActionPayload {
    reason?: string;
}

interface SubscriptionSnapshot {
    state: SubscriptionState;
    subscriptionEndDate?: Date;
    trialEndDate?: Date;
    gracePeriodEndDate?: Date;
    pastDueSince?: Date;
    isSuspended: boolean;
    deactivatedAt?: Date;
}

const TRANSITIONS: Record<SubscriptionState, SubscriptionState[]> = {
    [SubscriptionState.TRIALING]: [SubscriptionState.ACTIVE, SubscriptionState.PAST_DUE, SubscriptionState.DEACTIVATED],
    [SubscriptionState.ACTIVE]: [SubscriptionState.PAST_DUE, SubscriptionState.SUSPENDED, SubscriptionState.DEACTIVATED],
    [SubscriptionState.PAST_DUE]: [SubscriptionState.ACTIVE, SubscriptionState.GRACE, SubscriptionState.SUSPENDED, SubscriptionState.DEACTIVATED],
    [SubscriptionState.GRACE]: [SubscriptionState.ACTIVE, SubscriptionState.SUSPENDED, SubscriptionState.DEACTIVATED],
    [SubscriptionState.SUSPENDED]: [SubscriptionState.ACTIVE, SubscriptionState.DEACTIVATED],
    [SubscriptionState.DEACTIVATED]: [],
};

@Injectable()
export class SubscriptionLifecycleService {
    private readonly logger = new Logger(SubscriptionLifecycleService.name);

    constructor(
        @Inject(TENANT_REPOSITORY) private readonly tenants: ITenantRepository,
        private readonly features: EffectiveFeatureResolver,
        private readonly events: EventBus,
    ) { }

    async initializeTenantSubscription(tenantId: string, params: InitializeParams): Promise<void> {
        const tenant = await this.requireTenant(tenantId);
        const now = new Date();
        const targetState = params.mode === 'trial' ? SubscriptionState.TRIALING : SubscriptionState.ACTIVE;
        const trialDate = params.trialEndDate ?? tenant.trialEndDate ?? tenant.trialEndsAt ?? null;

        await this.transition(tenant, targetState, {
            subscriptionStartDate: now,
            subscriptionState: targetState,
            trialEndDate: trialDate || undefined,
            trialEndsAt: trialDate || tenant.trialEndsAt,
            subscriptionEndDate: params.subscriptionEndDate ?? tenant.subscriptionEndDate,
            editionId: params.editionId ?? tenant.editionId,
            pastDueSince: null,
            gracePeriodEndDate: null,
            graceStartedAt: null,
            isSuspended: false,
            suspendedAt: null,
            deactivatedAt: null,
        }, {
            reason: 'initialize',
            mode: params.mode,
            trialEndDate: trialDate,
            subscriptionEndDate: params.subscriptionEndDate,
        });
    }

    async onPaymentSuccess(tenantId: string, payload: PaymentSuccessPayload): Promise<void> {
        const tenant = await this.requireTenant(tenantId);
        if (tenant.subscriptionState === SubscriptionState.DEACTIVATED) {
            this.emitAudit('SubscriptionPaymentIgnored', tenantId, tenant, tenant.subscriptionSnapshot(), { reason: 'deactivated', invoiceId: payload.invoiceId });
            return;
        }

        const paidThroughDate = new Date(payload.paidThroughDate);
        const patch: Partial<Tenant> = {
            subscriptionState: SubscriptionState.ACTIVE,
            subscriptionEndDate: paidThroughDate,
            pastDueSince: null,
            gracePeriodEndDate: null,
            graceStartedAt: null,
            isSuspended: false,
            suspendedAt: null,
            lastPaymentSuccessAt: new Date(),
            lastInvoiceId: payload.invoiceId ?? tenant.lastInvoiceId,
        };

        await this.transition(tenant, SubscriptionState.ACTIVE, patch, {
            reason: 'payment_success',
            invoiceId: payload.invoiceId,
            paymentId: payload.paymentId,
            paidThroughDate,
        });

        this.events.publish(PlatformEvent.SUBSCRIPTION_PAYMENT_SUCCEEDED, {
            tenantId,
            editionId: tenant.editionId,
            invoiceId: payload.invoiceId,
            paymentId: payload.paymentId,
            subscriptionEndDate: paidThroughDate,
            gracePeriodEndDate: null,
            previousState: tenant.subscriptionState,
            newState: SubscriptionState.ACTIVE,
            timestamp: new Date(),
            metadata: {
                paidThroughDate,
            },
        }, tenantId);
    }

    async onPaymentFailure(tenantId: string, payload: PaymentFailurePayload): Promise<void> {
        const tenant = await this.requireTenant(tenantId);
        if (tenant.subscriptionState === SubscriptionState.DEACTIVATED) {
            this.emitAudit('SubscriptionPaymentIgnored', tenantId, tenant, tenant.subscriptionSnapshot(), { reason: 'deactivated', invoiceId: payload.invoiceId, failureReason: payload.reasonCode });
            return;
        }

        const failedAt = new Date(payload.failedAt);
        const graceDays = await this.safeGraceDays(tenantId);
        const gracePeriodEndDate = graceDays > 0 ? new Date(failedAt.getTime() + graceDays * 24 * 60 * 60 * 1000) : null;

        const patch: Partial<Tenant> = {
            subscriptionState: SubscriptionState.PAST_DUE,
            pastDueSince: tenant.pastDueSince || failedAt,
            graceStartedAt: gracePeriodEndDate ? failedAt : null,
            gracePeriodEndDate: gracePeriodEndDate || undefined,
            lastPaymentFailureAt: failedAt,
            lastInvoiceId: payload.invoiceId ?? tenant.lastInvoiceId,
        };

        const updated = await this.transition(tenant, SubscriptionState.PAST_DUE, patch, {
            reason: 'payment_failure',
            invoiceId: payload.invoiceId,
            failureReason: payload.reasonCode,
            gracePeriodEndDate,
        });

        this.events.publish(PlatformEvent.SUBSCRIPTION_PAYMENT_FAILED, {
            tenantId,
            editionId: tenant.editionId,
            invoiceId: payload.invoiceId,
            failureReason: payload.reasonCode,
            failedAt,
            previousState: tenant.subscriptionState,
            newState: updated.subscriptionState,
            subscriptionEndDate: tenant.subscriptionEndDate,
            gracePeriodEndDate: gracePeriodEndDate ?? tenant.gracePeriodEndDate,
            timestamp: failedAt,
            metadata: {
                reason: payload.reasonCode,
                gracePeriodEndDate,
            },
        }, tenantId);
    }

    async evaluateTenantSubscriptionState(tenantId: string, now: Date = new Date()): Promise<void> {
        const tenant = await this.requireTenant(tenantId);
        let target: SubscriptionState | null = null;
        const patch: Partial<Tenant> = {};

        if (tenant.subscriptionState === SubscriptionState.TRIALING && tenant.trialEndDate && tenant.trialEndDate < now) {
            target = SubscriptionState.PAST_DUE;
        } else if (tenant.subscriptionState === SubscriptionState.TRIALING && tenant.trialEndsAt && tenant.trialEndsAt < now) {
            target = SubscriptionState.PAST_DUE;
        }

        if (!target && tenant.subscriptionState === SubscriptionState.ACTIVE && tenant.subscriptionEndDate && tenant.subscriptionEndDate < now) {
            target = SubscriptionState.PAST_DUE;
        }

        if (!target && tenant.subscriptionState === SubscriptionState.PAST_DUE && tenant.gracePeriodEndDate) {
            if (tenant.gracePeriodEndDate < now) {
                target = SubscriptionState.SUSPENDED;
            } else if (!tenant.graceStartedAt || now >= tenant.graceStartedAt) {
                target = SubscriptionState.GRACE;
            }
        }

        if (!target && tenant.subscriptionState === SubscriptionState.GRACE && tenant.gracePeriodEndDate && tenant.gracePeriodEndDate < now) {
            target = SubscriptionState.SUSPENDED;
        }

        if (!target) {
            return;
        }

        await this.transition(tenant, target, patch, { reason: 'evaluate', now });
    }

    async hostSuspendTenant(tenantId: string, payload: HostActionPayload): Promise<void> {
        const tenant = await this.requireTenant(tenantId);
        const now = new Date();
        const patch: Partial<Tenant> = {
            subscriptionState: SubscriptionState.SUSPENDED,
            suspendedAt: now,
            isSuspended: true,
            suspensionReason: payload.reason,
        };

        await this.transition(tenant, SubscriptionState.SUSPENDED, patch, { reason: 'host_suspend', hostReason: payload.reason });
        this.events.publish(PlatformEvent.TENANT_SUSPENDED, { tenantId, reason: payload.reason }, tenantId);
    }

    async hostDeactivateTenant(tenantId: string, payload: HostActionPayload): Promise<void> {
        const tenant = await this.requireTenant(tenantId);
        const now = new Date();
        const patch: Partial<Tenant> = {
            subscriptionState: SubscriptionState.DEACTIVATED,
            deactivatedAt: now,
            isSuspended: true,
            suspendedAt: tenant.suspendedAt ?? now,
            suspensionReason: payload.reason ?? tenant.suspensionReason,
        };

        await this.transition(tenant, SubscriptionState.DEACTIVATED, patch, { reason: 'host_deactivate', hostReason: payload.reason });
        this.events.publish(PlatformEvent.TENANT_DEACTIVATED, { tenantId, reason: payload.reason }, tenantId);
    }

    async hostReactivateTenant(tenantId: string, payload: HostActionPayload): Promise<void> {
        const tenant = await this.requireTenant(tenantId);
        if (tenant.subscriptionState === SubscriptionState.DEACTIVATED) {
            throw new ReactivationNotAllowedException('Deactivated tenants require manual restore.');
        }

        const now = new Date();
        const hasActiveSubscription = !tenant.subscriptionEndDate || tenant.subscriptionEndDate > now;
        if (!hasActiveSubscription) {
            throw new ReactivationNotAllowedException('Subscription expired; extend subscription before reactivation.');
        }

        const patch: Partial<Tenant> = {
            subscriptionState: SubscriptionState.ACTIVE,
            isSuspended: false,
            suspendedAt: null,
            gracePeriodEndDate: null,
            graceStartedAt: null,
        };

        await this.transition(tenant, SubscriptionState.ACTIVE, patch, { reason: 'host_reactivate', hostReason: payload.reason });
        this.events.publish(PlatformEvent.TENANT_REACTIVATED, { tenantId, reason: payload.reason }, tenantId);
    }

    async getTenantSubscriptionSnapshot(tenantId: string): Promise<SubscriptionSnapshot> {
        const tenant = await this.requireTenant(tenantId);
        return this.snapshotSafe(tenant) as SubscriptionSnapshot;
    }

    async isTenantActiveForAccess(tenantId: string, policy: { includePastDue?: boolean; includeGrace?: boolean } = {}): Promise<boolean> {
        const tenant = await this.requireTenant(tenantId);
        if (tenant.subscriptionState === SubscriptionState.SUSPENDED || tenant.subscriptionState === SubscriptionState.DEACTIVATED) {
            return false;
        }
        return tenant.isSubscriptionActive(policy);
    }

    private async transition(
        tenant: Tenant,
        targetState: SubscriptionState,
        patch: Partial<Tenant>,
        metadata: Record<string, any>,
    ): Promise<Tenant> {
        if (!TRANSITIONS[tenant.subscriptionState]?.includes(targetState) && tenant.subscriptionState !== targetState) {
            throw new Error(`Invalid subscription transition from ${tenant.subscriptionState} to ${targetState}`);
        }

        const mergedPatch: Record<string, any> = {
            ...patch,
        };

        const isStateChange = tenant.subscriptionState !== targetState;
        if (isStateChange) {
            mergedPatch.subscriptionState = targetState;
            mergedPatch.stateVersion = (tenant.stateVersion || 1) + 1;
        }

        const updated = isStateChange || Object.keys(patch).length > 0
            ? await this.tenants.update(tenant.id, mergedPatch as Tenant)
            : tenant;

        if (isStateChange) {
            this.events.publish(PlatformEvent.SUBSCRIPTION_STATE_CHANGED, {
                tenantId: tenant.id,
                previousState: tenant.subscriptionState,
                newState: targetState,
                timestamp: new Date(),
                metadata,
            }, tenant.id);
        }

        if (isStateChange || Object.keys(patch).length > 0) {
            this.emitAudit(
                'SubscriptionStateTransition',
                tenant.id,
                this.snapshotSafe(tenant),
                this.snapshotSafe(updated),
                metadata,
            );
        }

        return updated;
    }

    private async requireTenant(tenantId: string): Promise<Tenant> {
        const tenant = await this.tenants.findById(tenantId);
        if (!tenant) {
            throw new TenantNotFoundException(tenantId);
        }
        return tenant;
    }

    private async safeGraceDays(tenantId: string): Promise<number> {
        try {
            const value = await this.features.getInt(tenantId, 'subscription.gracePeriodDays');
            return value >= 0 ? value : 0;
        } catch (error) {
            this.logger.warn(`Failed to resolve gracePeriodDays for tenant ${tenantId}: ${error?.message ?? error}`);
            return 0;
        }
    }

    private emitAudit(action: string, tenantId: string, before: any, after: any, metadata?: Record<string, any>): void {
        const payload = {
            action,
            targetTenantId: tenantId,
            timestamp: new Date().toISOString(),
            before,
            after,
            metadata: metadata || {},
        };
        this.logger.log(JSON.stringify(payload));
    }

    private snapshotSafe(entity: any): any {
        if (entity && typeof entity.subscriptionSnapshot === 'function') {
            return entity.subscriptionSnapshot();
        }
        if (!entity) return {};
        return {
            state: entity.subscriptionState,
            subscriptionEndDate: entity.subscriptionEndDate,
            trialEndDate: entity.trialEndDate ?? entity.trialEndsAt,
            gracePeriodEndDate: entity.gracePeriodEndDate,
            pastDueSince: entity.pastDueSince,
            isSuspended: entity.isSuspended,
            deactivatedAt: entity.deactivatedAt,
        };
    }
}
