import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

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
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/subscriptions`;

    getCurrent(): Observable<Subscription> {
        return this.http.get<Subscription>(`${this.baseUrl}/current`);
    }

    changePlan(plan: SubscriptionPlan, billingEmail: string, paymentMethodLast4?: string, paymentBrand?: string): Observable<Subscription> {
        return this.http.post<Subscription>(`${this.baseUrl}/change-plan`, {
            plan,
            billingEmail,
            paymentMethodLast4,
            paymentBrand,
        });
    }
}
