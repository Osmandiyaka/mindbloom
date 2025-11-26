import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Account {
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  parentCode?: string;
  active?: boolean;
}

export interface TrialBalanceRow {
  accountCode: string;
  debit: number;
  credit: number;
  balance: number;
}

@Injectable({ providedIn: 'root' })
export class AccountingService {
  accounts = signal<Account[]>([]);
  trialBalance = signal<TrialBalanceRow[]>([]);
  periods = signal<any[]>([]);

  constructor(private http: HttpClient) {
    this.loadAccounts();
    this.loadTrialBalance();
    this.loadPeriods();
  }

  loadAccounts() {
    this.http.get<Account[]>(`${environment.apiUrl}/accounting/accounts`).subscribe(list => this.accounts.set(list));
  }

  createAccount(dto: Account) {
    return this.http.post(`${environment.apiUrl}/accounting/accounts`, dto).subscribe(() => this.loadAccounts());
  }

  loadTrialBalance(asOf?: Date) {
    const params: any = asOf ? { asOf: asOf.toISOString() } : {};
    this.http.get<TrialBalanceRow[]>(`${environment.apiUrl}/accounting/trial-balance`, { params }).subscribe(rows => this.trialBalance.set(rows));
  }

  postJournal(dto: any) {
    return this.http.post(`${environment.apiUrl}/accounting/journals`, dto);
  }

  loadPeriods() {
    this.http.get<any[]>(`${environment.apiUrl}/accounting/periods`).subscribe(list => this.periods.set(list));
  }

  upsertPeriod(dto: { name: string; start: string; end: string }) {
    return this.http.post(`${environment.apiUrl}/accounting/periods`, dto).subscribe(() => this.loadPeriods());
  }

  closePeriod(id: string) {
    return this.http.post(`${environment.apiUrl}/accounting/periods/${id}/close?id=${id}`, {}).subscribe(() => this.loadPeriods());
  }

  reopenPeriod(id: string) {
    return this.http.post(`${environment.apiUrl}/accounting/periods/${id}/reopen?id=${id}`, {}).subscribe(() => this.loadPeriods());
  }
}
