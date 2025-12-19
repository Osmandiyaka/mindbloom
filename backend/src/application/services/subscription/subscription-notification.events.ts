import { SubscriptionState } from '../../../domain/tenant/entities/tenant.entity';
import { PlatformEvent } from '../../../core/plugins/event-bus.service';

export enum SubscriptionNotificationEvent {
    ExpiringSoon = PlatformEvent.SUBSCRIPTION_EXPIRING_SOON,
    Expired = PlatformEvent.SUBSCRIPTION_EXPIRED,
    PaymentFailed = PlatformEvent.SUBSCRIPTION_PAYMENT_FAILED,
    PaymentSucceeded = PlatformEvent.SUBSCRIPTION_PAYMENT_SUCCEEDED,
    PlanChanged = PlatformEvent.SUBSCRIPTION_PLAN_CHANGED,
    ConsistencyIssue = PlatformEvent.SUBSCRIPTION_CONSISTENCY_ISSUE,
}

export interface SubscriptionNotificationPayload {
    tenantId: string;
    editionId?: string | null;
    previousState?: SubscriptionState;
    newState?: SubscriptionState;
    subscriptionEndDate?: Date | null;
    gracePeriodEndDate?: Date | null;
    correlationId?: string;
    timestamp: Date;
    metadata?: {
        daysLeft?: number;
        invoiceId?: string;
        paymentId?: string;
        reason?: string;
        policyAction?: string;
    };
}

export type SubscriptionNotification = {
    event: SubscriptionNotificationEvent;
    payload: SubscriptionNotificationPayload;
};
