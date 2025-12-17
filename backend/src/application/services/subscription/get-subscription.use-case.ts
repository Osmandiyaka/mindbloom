import { Inject, Injectable } from '@nestjs/common';
import { SUBSCRIPTION_REPOSITORY, SubscriptionRepository } from '../../../domain/ports/out/subscription-repository.port';
import { Subscription, Invoice } from '../../../domain/subscription/entities/subscription.entity';
import { ITenantRepository, TENANT_REPOSITORY } from '../../../domain/ports/out/tenant-repository.port';

@Injectable()
export class GetSubscriptionUseCase {
    constructor(
        @Inject(SUBSCRIPTION_REPOSITORY)
        private readonly subscriptionRepository: SubscriptionRepository,
        @Inject(TENANT_REPOSITORY)
        private readonly tenantRepository: ITenantRepository,
    ) { }

    async execute(tenantId: string, billingEmail: string): Promise<Subscription> {
        const existing = await this.subscriptionRepository.findByTenantId(tenantId);
        const base = existing ?? await this.subscriptionRepository.save(Subscription.create(tenantId, billingEmail));

        // Enrich with tenant billing invoices (tenant.billing.invoices) if present
        const tenant = await this.tenantRepository.findById(tenantId);
        const billingInvoices: Invoice[] = (tenant?.billing?.invoices || []).map((inv: any) => ({
            id: inv.id,
            amount: inv.amount,
            currency: inv.currency || 'USD',
            createdAt: inv.date ? new Date(inv.date) : new Date(),
            description: inv.description || 'Tenant billing invoice',
            status: (inv.status === 'paid' ? 'paid' : 'open') as Invoice['status'],
        }));

        return new Subscription(
            base.id,
            base.tenantId,
            base.planId,
            base.plan,
            base.status,
            base.currentPeriodEnd,
            base.billingEmail,
            base.paymentMethodLast4,
            base.paymentBrand,
            [...billingInvoices, ...base.invoices],
            base.createdAt,
            base.updatedAt,
        );
    }
}
