import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FeePlan, Invoice } from '../models/fees.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FeesService {
    plans = signal<FeePlan[]>([]);

    invoices = signal<Invoice[]>([]);

    constructor(private http: HttpClient) {
        this.refreshPlans();
        this.refreshInvoices();
    }

    recordPayment(id: string) {
        this.http.patch(`${environment.apiUrl}/fees/invoices/${id}/pay`, {}).subscribe(() => this.refreshInvoices());
    }

    addInvoice(invoice: Omit<Invoice, 'id' | 'status'>) {
        this.http.post(`${environment.apiUrl}/fees/invoices`, invoice).subscribe(() => this.refreshInvoices());
    }

    defaultPlanId(): string | undefined {
        return this.plans()[0]?.id;
    }

    refreshPlans() {
        this.http.get<any[]>(`${environment.apiUrl}/fees/plans`).subscribe(plans => {
            this.plans.set(plans.map(p => ({ ...p, id: p.id || p._id })));
        });
    }

    refreshInvoices() {
        this.http.get<any[]>(`${environment.apiUrl}/fees/invoices`).subscribe(invoices => {
            this.invoices.set(invoices.map(inv => ({
                ...inv,
                id: inv.id || inv._id,
                dueDate: inv.dueDate ? new Date(inv.dueDate) : new Date()
            })));
        });
    }
}
