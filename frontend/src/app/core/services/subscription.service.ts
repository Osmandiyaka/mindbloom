import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../http/api-client.service';

export type SubscriptionPlan = 'free' | 'basic' | 'premium' | 'enterprise';

export interface Subscription {
    plan: SubscriptionPlan;
    status: 'active' | 'past_due' | 'canceled' | 'trialing';
    currentPeriodEnd: string;
    billingEmail: string;
    paymentMethodLast4?: string;
    paymentBrand?: string;
    invoices: Array<{
        id: string;
        amount: number;
        currency: string;
        createdAt: string;
        description: string;
        status: 'paid' | 'open' | 'void';
    }>;
}

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
    private api = inject(ApiClient);
    private basePath = 'subscriptions';

    getCurrent(): Observable<Subscription> {
        return this.api.get<Subscription>(`${this.basePath}/current`);
    }

    changePlan(plan: SubscriptionPlan, billingEmail: string, paymentMethodLast4?: string, paymentBrand?: string): Observable<Subscription> {
        return this.api.post<Subscription>(`${this.basePath}/change-plan`, {
            plan,
            billingEmail,
            paymentMethodLast4,
            paymentBrand,
        });
    }
}
