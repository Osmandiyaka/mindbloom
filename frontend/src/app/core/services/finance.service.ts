import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AccountingService } from './accounting.service';

export interface BudgetSummary {
  _id?: string;
  name: string;
  code: string;
  limit: number;
  spent: number;
  status: string;
  available?: number;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class FinanceService {
  budgets = signal<BudgetSummary[]>([]);
  purchaseRequests = signal<any[]>([]);
  expenses = signal<any[]>([]);

  constructor(private http: HttpClient, private accounting: AccountingService) {
    this.loadBudgets();
    this.loadPurchaseRequests();
    this.loadExpenses();
  }

  loadBudgets() {
    this.http.get<BudgetSummary[]>(`${environment.apiUrl}/finance/budgets`).subscribe(list => this.budgets.set(list));
  }

  createBudget(dto: Partial<BudgetSummary>) {
    return this.http.post(`${environment.apiUrl}/finance/budgets`, dto).subscribe(() => this.loadBudgets());
  }

  loadPurchaseRequests(status?: string) {
    const params: any = status ? { status } : {};
    this.http.get<any[]>(`${environment.apiUrl}/finance/purchase-requests`, { params }).subscribe(list => this.purchaseRequests.set(list));
  }

  createPurchase(dto: any) {
    return this.http.post(`${environment.apiUrl}/finance/purchase-requests`, dto).subscribe(() => this.loadPurchaseRequests());
  }

  approvePurchase(id: string, dto: any) {
    return this.http.post(`${environment.apiUrl}/finance/purchase-requests/${id}/approve`, dto).subscribe(() => this.loadPurchaseRequests());
  }

  loadExpenses(status?: string) {
    const params: any = status ? { status } : {};
    this.http.get<any[]>(`${environment.apiUrl}/finance/expenses`, { params }).subscribe(list => this.expenses.set(list));
  }

  createExpense(dto: any) {
    return this.http.post(`${environment.apiUrl}/finance/expenses`, dto).subscribe(() => this.loadExpenses());
  }

  approveExpense(id: string, dto: any) {
    return this.http.post(`${environment.apiUrl}/finance/expenses/${id}/approve`, dto).subscribe(() => this.loadExpenses());
  }

  trialBalance() {
    return this.accounting.trialBalance();
  }
}
