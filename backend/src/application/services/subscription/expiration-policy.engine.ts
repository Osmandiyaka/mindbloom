import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventBus, PlatformEvent } from '../../../core/plugins/event-bus.service';
import { ITenantRepository, TENANT_REPOSITORY } from '../../../domain/ports/out/tenant-repository.port';
import { Tenant, SubscriptionState, ExpirationAction, ExpirationPolicyOverride } from '../../../domain/tenant/entities/tenant.entity';
import { TenantNotFoundException, ReactivationNotAllowedException } from '../../../domain/exceptions/tenant-subscription.exception';
import { SubscriptionLifecycleService } from './subscription-lifecycle.service';
import { TenantManager } from '../tenant/tenant-manager.service';
import { AssignBehavior } from '../../../domain/tenant/entities/tenant-subscription.types';
import { SubscriptionNotificationEvent, SubscriptionNotificationPayload } from './subscription-notification.events';

export interface ExpirationPolicyConfig {
    expirationAction: ExpirationAction;
    graceDays: number;
    fallbackEditionId?: string | null;
    notifyDaysBeforeExpiry: number[];
    pastDueWindowDays: number;
    maxPastDueDaysBeforeAction?: number | null;
}

export interface PolicyDecision {
    tenantId: string;
    policy: ExpirationPolicyConfig;
    currentState: SubscriptionState;
    isExpired: boolean;
    isPastDue: boolean;
    isInGrace: boolean;
    pastDueWindowEndsAt?: Date | null;
    graceEndDate?: Date | null;
    maxPastDueDeadline?: Date | null;
    actionToApply: ExpirationAction | 'NONE';
    reason: string;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class ExpirationPolicyEngine {
    private readonly logger = new Logger(ExpirationPolicyEngine.name);
    private readonly hardDefaults: ExpirationPolicyConfig = {
        expirationAction: 'SUSPEND',
        graceDays: 7,
        fallbackEditionId: null,
        notifyDaysBeforeExpiry: [14, 7, 3, 1],
        pastDueWindowDays: 2,
        maxPastDueDaysBeforeAction: 30,
    };

    constructor(
        @Inject(TENANT_REPOSITORY) private readonly tenants: ITenantRepository,
        private readonly lifecycle: SubscriptionLifecycleService,
        private readonly tenantManager: TenantManager,
        private readonly config: ConfigService,
        private readonly events: EventBus,
    ) { }

    async evaluate(tenantId: string, now: Date = new Date()): Promise<PolicyDecision> {
        await this.lifecycle.evaluateTenantSubscriptionState(tenantId, now);
        const tenant = await this.requireTenant(tenantId);
        const policy = await this.resolvePolicyConfig(tenant);

        const isExpired = !!tenant.subscriptionEndDate && tenant.subscriptionEndDate < now;
        const isPastDue = tenant.subscriptionState === SubscriptionState.PAST_DUE;
        const isInGrace = tenant.subscriptionState === SubscriptionState.GRACE;

        const pastDueWindowEndsAt = this.addDays(tenant.subscriptionEndDate ?? tenant.trialEndDate ?? tenant.trialEndsAt, policy.pastDueWindowDays);
        const graceAnchor = tenant.gracePeriodEndDate
            ? tenant.gracePeriodEndDate
            : this.addDays(pastDueWindowEndsAt ?? tenant.subscriptionEndDate ?? tenant.pastDueSince ?? tenant.trialEndDate, policy.graceDays);
        const graceEndDate = graceAnchor ?? null;
        const maxPastDueDeadline = policy.maxPastDueDaysBeforeAction && tenant.subscriptionEndDate
            ? this.addDays(tenant.subscriptionEndDate, policy.maxPastDueDaysBeforeAction)
            : null;

        const windowElapsed = pastDueWindowEndsAt ? now >= pastDueWindowEndsAt : (isExpired || isPastDue || isInGrace);
        const graceElapsed = graceEndDate ? now >= graceEndDate : false;
        const pastDueDeadlineElapsed = maxPastDueDeadline ? now >= maxPastDueDeadline : false;

        let actionToApply: ExpirationAction | 'NONE' = 'NONE';
        let reason = 'noop';

        if (tenant.subscriptionState === SubscriptionState.DEACTIVATED) {
            reason = 'already-deactivated';
        } else if (!isExpired && (tenant.subscriptionState === SubscriptionState.ACTIVE || tenant.subscriptionState === SubscriptionState.TRIALING)) {
            reason = 'not-expired';
        } else {
            switch (policy.expirationAction) {
                case 'FALLBACK_TO_FREE':
                    if (policy.fallbackEditionId) {
                        actionToApply = 'FALLBACK_TO_FREE';
                        reason = 'policy:fallback_to_free';
                    } else {
                        reason = 'fallback-edition-missing';
                    }
                    break;
                case 'SUSPEND':
                    if (graceElapsed || pastDueDeadlineElapsed) {
                        actionToApply = 'SUSPEND';
                        reason = graceElapsed ? 'grace-ended' : 'max-past-due-exceeded';
                    } else if (!graceEndDate && windowElapsed) {
                        actionToApply = 'SUSPEND';
                        reason = 'past-due-window-ended';
                    } else {
                        reason = 'within-grace';
                    }
                    break;
                case 'DEACTIVATE':
                    if (graceElapsed || windowElapsed || pastDueDeadlineElapsed) {
                        actionToApply = 'DEACTIVATE';
                        reason = graceElapsed ? 'grace-ended' : pastDueDeadlineElapsed ? 'max-past-due-exceeded' : 'past-due-window-ended';
                    }
                    break;
                default:
                    reason = 'unknown-policy-action';
                    break;
            }
        }

        return {
            tenantId,
            policy,
            currentState: tenant.subscriptionState,
            isExpired,
            isPastDue,
            isInGrace,
            pastDueWindowEndsAt,
            graceEndDate,
            maxPastDueDeadline,
            actionToApply,
            reason,
        };
    }

    async getPolicyConfig(tenantId: string): Promise<ExpirationPolicyConfig> {
        const tenant = await this.requireTenant(tenantId);
        return this.resolvePolicyConfig(tenant);
    }

    async applyDecision(decision: PolicyDecision, actor: string = 'system'): Promise<void> {
        if (!decision || decision.actionToApply === 'NONE') {
            return;
        }

        const tenant = await this.requireTenant(decision.tenantId);
        const before = tenant.subscriptionSnapshot();
        let afterTenant: Tenant = tenant;

        try {
            if (decision.actionToApply === 'FALLBACK_TO_FREE') {
                if (!decision.policy.fallbackEditionId) {
                    this.logger.warn(`Cannot fallback tenant ${tenant.id}: missing fallbackEditionId`);
                    return;
                }

                const needsEditionUpdate = tenant.editionId !== decision.policy.fallbackEditionId;
                if (needsEditionUpdate) {
                    await this.tenantManager.assignEditionToTenant(
                        tenant.id,
                        decision.policy.fallbackEditionId,
                        null,
                        AssignBehavior.IMMEDIATE,
                    );
                }

                if (tenant.subscriptionState !== SubscriptionState.ACTIVE) {
                    try {
                        await this.lifecycle.hostReactivateTenant(tenant.id, { reason: 'expiration_policy_fallback' });
                    } catch (error) {
                        if (!(error instanceof ReactivationNotAllowedException)) {
                            throw error;
                        }
                        this.logger.warn(`Reactivation skipped for tenant ${tenant.id}: ${error.message}`);
                    }
                }

            } else if (decision.actionToApply === 'SUSPEND') {
                if (tenant.subscriptionState !== SubscriptionState.SUSPENDED) {
                    await this.lifecycle.hostSuspendTenant(tenant.id, { reason: 'expiration_policy' });
                }
            } else if (decision.actionToApply === 'DEACTIVATE') {
                if (tenant.subscriptionState !== SubscriptionState.DEACTIVATED) {
                    await this.lifecycle.hostDeactivateTenant(tenant.id, { reason: 'expiration_policy' });
                }
            }

            afterTenant = await this.requireTenant(decision.tenantId);

            if (decision.actionToApply === 'FALLBACK_TO_FREE') {
                this.emitNotification(decision, PlatformEvent.SUBSCRIPTION_PLAN_CHANGED, afterTenant, before, actor);
            } else if (decision.actionToApply === 'SUSPEND' || decision.actionToApply === 'DEACTIVATE') {
                this.emitNotification(decision, PlatformEvent.SUBSCRIPTION_EXPIRED, afterTenant, before, actor);
            }

            this.emitAudit(decision, before, afterTenant.subscriptionSnapshot(), actor);
        } catch (error) {
            this.logger.error(`Failed to apply expiration decision for tenant ${decision.tenantId}: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }

    private async resolvePolicyConfig(tenant: Tenant): Promise<ExpirationPolicyConfig> {
        const override = tenant.expirationPolicy || {} as ExpirationPolicyOverride;
        const global = this.getGlobalDefaults();

        const expirationAction = this.normalizeAction(override.expirationAction || global.expirationAction || this.hardDefaults.expirationAction);
        const graceDays = override.graceDays ?? global.graceDays ?? this.hardDefaults.graceDays;
        const fallbackEditionId = override.fallbackEditionId ?? global.fallbackEditionId ?? this.hardDefaults.fallbackEditionId;
        const notifyDaysBeforeExpiry = this.normalizeNotifyDays(override.notifyDaysBeforeExpiry ?? global.notifyDaysBeforeExpiry ?? this.hardDefaults.notifyDaysBeforeExpiry);
        const pastDueWindowDays = override.pastDueWindowDays ?? global.pastDueWindowDays ?? this.hardDefaults.pastDueWindowDays;
        const maxPastDueDaysBeforeAction = override.maxPastDueDaysBeforeAction ?? global.maxPastDueDaysBeforeAction ?? this.hardDefaults.maxPastDueDaysBeforeAction ?? null;

        return {
            expirationAction,
            graceDays: graceDays >= 0 ? graceDays : 0,
            fallbackEditionId: fallbackEditionId ?? null,
            notifyDaysBeforeExpiry,
            pastDueWindowDays: pastDueWindowDays >= 0 ? pastDueWindowDays : 0,
            maxPastDueDaysBeforeAction: maxPastDueDaysBeforeAction ?? null,
        };
    }

    private getGlobalDefaults(): Partial<ExpirationPolicyConfig> {
        const action = this.config.get<string>('SUBSCRIPTION_EXPIRATION_ACTION');
        const graceDays = this.parseNumberValue(this.config.get('SUBSCRIPTION_EXPIRATION_GRACE_DAYS'));
        const fallbackEditionId = this.config.get<string>('SUBSCRIPTION_EXPIRATION_FALLBACK_EDITION_ID');
        const notifyDaysRaw = this.config.get<string>('SUBSCRIPTION_NOTIFY_DAYS_BEFORE_EXPIRY');
        const pastDueWindowDays = this.parseNumberValue(this.config.get('SUBSCRIPTION_PAST_DUE_WINDOW_DAYS'));
        const maxPastDueDaysBeforeAction = this.parseNumberValue(this.config.get('SUBSCRIPTION_MAX_PAST_DUE_DAYS'));

        return {
            expirationAction: action ? this.normalizeAction(action) : undefined,
            graceDays: graceDays,
            fallbackEditionId: fallbackEditionId || undefined,
            notifyDaysBeforeExpiry: this.normalizeNotifyDays(this.parseNumberList(notifyDaysRaw)),
            pastDueWindowDays: pastDueWindowDays,
            maxPastDueDaysBeforeAction: maxPastDueDaysBeforeAction,
        };
    }

    private parseNumberValue(value: string | number | undefined | null): number | undefined {
        if (value === null || value === undefined) return undefined;
        const parsed = typeof value === 'number' ? value : parseInt(value, 10);
        return Number.isNaN(parsed) ? undefined : parsed;
    }

    private parseNumberList(raw?: string): number[] | undefined {
        if (!raw) return undefined;
        return raw.split(',')
            .map((v) => parseInt(v.trim(), 10))
            .filter((n) => !Number.isNaN(n));
    }

    private normalizeNotifyDays(values?: number[]): number[] {
        if (!values || values.length === 0) return [];
        const unique = Array.from(new Set(values.filter((n) => n >= 0)));
        return unique.sort((a, b) => b - a); // descending for convenience
    }

    private normalizeAction(action?: string): ExpirationAction {
        const normalized = (action || '').toUpperCase();
        if (normalized === 'FALLBACK_TO_FREE') return 'FALLBACK_TO_FREE';
        if (normalized === 'DEACTIVATE') return 'DEACTIVATE';
        return 'SUSPEND';
    }

    private addDays(base: Date | null | undefined, days: number): Date | null {
        if (!base || Number.isNaN(base.getTime())) return null;
        const target = new Date(base.getTime() + days * MS_PER_DAY);
        return target;
    }

    private emitAudit(decision: PolicyDecision, before: any, after: any, actor: string): void {
        const payload = {
            action: 'TenantExpirationPolicyApplied',
            targetTenantId: decision.tenantId,
            actor,
            timestamp: new Date().toISOString(),
            before,
            after,
            metadata: {
                decision,
            },
        };
        this.logger.log(JSON.stringify(payload));
        this.events.publish(PlatformEvent.TENANT_EXPIRATION_POLICY_APPLIED, payload, decision.tenantId);
    }

    private emitNotification(decision: PolicyDecision, event: PlatformEvent, tenant: Tenant, before: any, actor: string): void {
        const payload: SubscriptionNotificationPayload = {
            tenantId: tenant.id,
            editionId: tenant.editionId,
            previousState: before?.state,
            newState: tenant.subscriptionState,
            subscriptionEndDate: tenant.subscriptionEndDate,
            gracePeriodEndDate: tenant.gracePeriodEndDate,
            timestamp: new Date(),
            metadata: {
                reason: decision.reason,
                policyAction: decision.actionToApply,
            },
        };

        const eventName = event as unknown as SubscriptionNotificationEvent;
        this.events.publish(eventName, payload, tenant.id);
        this.logger.log(JSON.stringify({ actor, tenantId: tenant.id, event: eventName, payload }));
    }

    private async requireTenant(tenantId: string): Promise<Tenant> {
        const tenant = await this.tenants.findById(tenantId);
        if (!tenant) {
            throw new TenantNotFoundException(tenantId);
        }
        return tenant;
    }
}
