import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FeePlan, Invoice, Payment } from '../models/fees.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FeesService {
    plans = signal<FeePlan[]>([]);

    invoices = signal<Invoice[]>([]);
    loading = signal<boolean>(false);

    constructor(private http: HttpClient) {
        this.refreshPlans();
        this.refreshInvoices();
    }

    recordPayment(id: string, payment: Omit<Payment, 'invoiceId'>) {
        this.http.patch(`${environment.apiUrl}/fees/invoices/${id}/pay`, payment)
            .subscribe(() => this.refreshInvoices());
    }

    addInvoice(invoice: Partial<Invoice> & { studentName: string; planId: string; dueDate: Date; amount: number; studentId?: string }) {
        const payload: any = {
            ...invoice,
            dueDate: invoice.dueDate.toISOString(),
        };
        if (!payload.studentId) delete payload.studentId;
        this.http.post(`${environment.apiUrl}/fees/invoices`, payload).subscribe(() => this.refreshInvoices());
    }

    defaultPlanId(): string | undefined {
        return this.plans()[0]?.id;
    }

    refreshPlans() {
        this.http.get<any[]>(`${environment.apiUrl}/fees/plans`).subscribe(plans => {
            this.plans.set(plans.map(p => ({ ...p, id: p.id || p._id })));
        });
    }

    createPlan(dto: Partial<FeePlan> & { name: string; amount: number; frequency: FeePlan['frequency'] }) {
        return this.http.post(`${environment.apiUrl}/fees/plans`, dto).subscribe(() => this.refreshPlans());
    }

    deletePlan(id: string) {
        return this.http.delete(`${environment.apiUrl}/fees/plans/${id}`).subscribe(() => this.refreshPlans());
    }

    refreshInvoices(filters?: { status?: string }) {
        let params = new HttpParams();
        if (filters?.status) params = params.set('status', filters.status);
        this.loading.set(true);
        this.http.get<any[]>(`${environment.apiUrl}/fees/invoices`, { params }).subscribe(invoices => {
            this.invoices.set(invoices.map(inv => ({
                ...inv,
                id: inv.id || inv._id,
                dueDate: inv.dueDate ? new Date(inv.dueDate) : new Date(),
                paidAmount: inv.paidAmount ?? 0,
                balance: inv.balance ?? Math.max((inv.amount || 0) - (inv.paidAmount || 0), 0),
            })));
            this.loading.set(false);
        }, () => this.loading.set(false));
    }
}
