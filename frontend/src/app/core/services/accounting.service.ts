import { Injectable, signal } from '@angular/core';
import { of } from 'rxjs';

export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense';

export interface Account {
  code: string;
  name: string;
  type: AccountType;
  parentCode?: string;
  category?: string;
  normalBalance?: 'debit' | 'credit';
  balance?: number;
  active?: boolean;
}

export interface AccountNode extends Account {
  children?: AccountNode[];
}

export interface TrialBalanceRow {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface AccountingMetric {
  label: string;
  value: string;
  trend?: string;
  icon?: string;
}

export interface FeeStructurePreview {
  name: string;
  grade: string;
  academicYear: string;
  components: { label: string; amount: number }[];
  total: number;
  paymentTerm: 'full' | 'termly' | 'monthly';
}

export interface JournalEntryPreview {
  entryNumber: string;
  date: string;
  memo: string;
  ref?: string;
  status: 'posted' | 'draft';
  debit: number;
  credit: number;
}

export interface FeeCandidate {
  id: string;
  name: string;
  grade: string;
  admissionNo: string;
  structure?: string;
  plan?: 'full' | 'termly' | 'monthly';
  baseTotal: number;
  discountPct?: number;
  scholarship?: string;
  customTotal?: number;
  selected?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AccountingService {
  accounts = signal<AccountNode[]>([]);
  trialBalance = signal<TrialBalanceRow[]>([]);
  periods = signal<any[]>([]);
  metrics = signal<AccountingMetric[]>([]);
  cashPosition = signal<{ cash: number; bank: number; ar: number; ap: number }>({ cash: 0, bank: 0, ar: 0, ap: 0 });
  feeStructures = signal<FeeStructurePreview[]>([]);
  journals = signal<JournalEntryPreview[]>([]);
  feeCandidates = signal<FeeCandidate[]>([]);

  constructor() {
    this.loadMockData();
  }

  private loadMockData() {
    const sampleAccounts: AccountNode[] = [
      {
        code: '1000',
        name: 'Cash & Bank',
        type: 'asset',
        category: 'Current Asset',
        normalBalance: 'debit',
        balance: 125000,
        children: [
          { code: '1010', name: 'Cash on Hand', type: 'asset', balance: 15000 },
          { code: '1020', name: 'Main Bank', type: 'asset', balance: 85000 },
          { code: '1030', name: 'Tuition Collections Bank', type: 'asset', balance: 25000 }
        ]
      },
      {
        code: '1200',
        name: 'Accounts Receivable',
        type: 'asset',
        category: 'Current Asset',
        normalBalance: 'debit',
        balance: 42000
      },
      {
        code: '2000',
        name: 'Accounts Payable',
        type: 'liability',
        category: 'Current Liability',
        normalBalance: 'credit',
        balance: -18000
      },
      {
        code: '4000',
        name: 'Fee Income',
        type: 'income',
        category: 'Income',
        normalBalance: 'credit',
        balance: -96000,
        children: [
          { code: '4010', name: 'Tuition', type: 'income', balance: -75000 },
          { code: '4020', name: 'Transport Fees', type: 'income', balance: -12000 },
          { code: '4030', name: 'Meal Fees', type: 'income', balance: -9000 }
        ]
      },
      {
        code: '5000',
        name: 'Operating Expenses',
        type: 'expense',
        category: 'Expense',
        normalBalance: 'debit',
        balance: 54000,
        children: [
          { code: '5010', name: 'Salaries', type: 'expense', balance: 32000 },
          { code: '5020', name: 'Utilities', type: 'expense', balance: 6200 },
          { code: '5030', name: 'Supplies', type: 'expense', balance: 4800 },
          { code: '5040', name: 'Maintenance', type: 'expense', balance: 5200 }
        ]
      }
    ];

    const sampleTrial: TrialBalanceRow[] = [
      { accountCode: '1010', accountName: 'Cash on Hand', debit: 15000, credit: 0, balance: 15000 },
      { accountCode: '1020', accountName: 'Main Bank', debit: 85000, credit: 0, balance: 85000 },
      { accountCode: '1200', accountName: 'Accounts Receivable', debit: 42000, credit: 0, balance: 42000 },
      { accountCode: '2000', accountName: 'Accounts Payable', debit: 0, credit: 18000, balance: -18000 },
      { accountCode: '4010', accountName: 'Tuition', debit: 0, credit: 75000, balance: -75000 },
      { accountCode: '5010', accountName: 'Salaries', debit: 32000, credit: 0, balance: 32000 }
    ];

    const samplePeriods = [
      { id: 'p1', name: 'Term 1 2025', start: '2025-01-10', end: '2025-04-05', status: 'open' },
      { id: 'p2', name: 'Term 2 2025', start: '2025-04-20', end: '2025-07-15', status: 'planned' }
    ];

    const sampleMetrics: AccountingMetric[] = [
      { label: "Today's Collections", value: '$18,400', trend: '+8.5%', icon: '💰' },
      { label: 'Overdue Invoices', value: '42', trend: '12 overdue', icon: '⏰' },
      { label: 'Pending Payments', value: '$9,250', trend: '3 due this week', icon: '📥' },
      { label: 'Cash Position', value: '$125,000', trend: 'incl. bank & cash', icon: '🏦' }
    ];

    const sampleFees: FeeStructurePreview[] = [
      {
        name: 'Primary Tuition',
        grade: 'Grade 5',
        academicYear: '2025',
        components: [
          { label: 'Tuition', amount: 1800 },
          { label: 'Transport', amount: 320 },
          { label: 'Meals', amount: 260 }
        ],
        total: 2380,
        paymentTerm: 'termly'
      },
      {
        name: 'Junior High',
        grade: 'Grade 8',
        academicYear: '2025',
        components: [
          { label: 'Tuition', amount: 2300 },
          { label: 'Lab Fees', amount: 180 },
          { label: 'Library', amount: 90 }
        ],
        total: 2570,
        paymentTerm: 'termly'
      }
    ];

    const sampleJournals: JournalEntryPreview[] = [
      { entryNumber: 'JV-2025-0001', date: '2025-02-05', memo: 'Tuition collection - cash', ref: 'RCPT-102', status: 'posted', debit: 12000, credit: 12000 },
      { entryNumber: 'JV-2025-0002', date: '2025-02-05', memo: 'Salaries January', ref: 'PAY-023', status: 'posted', debit: 32000, credit: 32000 },
      { entryNumber: 'JV-2025-0003', date: '2025-02-06', memo: 'Utility bill', ref: 'BILL-112', status: 'draft', debit: 1800, credit: 1800 }
    ];

    const sampleCandidates: FeeCandidate[] = [
      { id: 's1', name: 'Amaka Obi', grade: 'Grade 6', admissionNo: 'ADM-1023', structure: 'Primary Tuition', plan: 'termly', baseTotal: 2380, discountPct: 5 },
      { id: 's2', name: 'Chidi Okeke', grade: 'Grade 5', admissionNo: 'ADM-1011', structure: 'Primary Tuition', plan: 'termly', baseTotal: 2380 },
      { id: 's3', name: 'Sara Danjuma', grade: 'Grade 7', admissionNo: 'ADM-1029', structure: 'Junior High', plan: 'termly', baseTotal: 2570, scholarship: 'STEM 20%' },
      { id: 's4', name: 'Tomi Bello', grade: 'Grade 8', admissionNo: 'ADM-1031', structure: 'Junior High', plan: 'termly', baseTotal: 2570 }
    ];

    this.accounts.set(sampleAccounts);
    this.trialBalance.set(sampleTrial);
    this.periods.set(samplePeriods);
    this.metrics.set(sampleMetrics);
    this.cashPosition.set({ cash: 15000, bank: 110000, ar: 42000, ap: 18000 });
    this.feeStructures.set(sampleFees);
    this.journals.set(sampleJournals);
    this.feeCandidates.set(sampleCandidates);
  }

  createAccount(dto: Account) {
    const current = [...this.accounts()];
    dto.active = dto.active ?? true;
    const parentCode = dto.parentCode;
    if (parentCode) {
      const attach = (nodes: AccountNode[]): boolean => {
        for (const node of nodes) {
          if (node.code === parentCode) {
            node.children = [...(node.children || []), { ...dto }];
            return true;
          }
          if (node.children && attach(node.children)) return true;
        }
        return false;
      };
      attach(current);
    } else {
      current.push({ ...dto });
    }
    this.accounts.set(current);
  }

  updateAccount(dto: Account) {
    const updateNode = (nodes: AccountNode[]): AccountNode[] =>
      nodes.map(node => {
        if (node.code === dto.code) {
          return { ...node, ...dto };
        }
        if (node.children) {
          return { ...node, children: updateNode(node.children) };
        }
        return node;
      });
    this.accounts.set(updateNode(this.accounts()));
  }

  toggleAccountActive(code: string) {
    const toggleNode = (nodes: AccountNode[]): AccountNode[] =>
      nodes.map(node => {
        if (node.code === code) {
          return { ...node, active: node.active === false ? true : false };
        }
        if (node.children) {
          return { ...node, children: toggleNode(node.children) };
        }
        return node;
      });
    this.accounts.set(toggleNode(this.accounts()));
  }

  // Compatibility stubs for existing callers
  loadTrialBalance(asOf?: Date) {
    // Optionally adjust mock asOf filtering
    return of(this.trialBalance());
  }

  postJournal(dto: any) {
    const nextNumber = `JV-2025-${String(this.journals().length + 1).padStart(4, '0')}`;
    const entry: JournalEntryPreview = {
      entryNumber: nextNumber,
      date: dto.date?.toISOString ? dto.date.toISOString().slice(0, 10) : dto.date || new Date().toISOString().slice(0, 10),
      memo: dto.memo || 'Journal entry',
      ref: dto.refNo,
      status: 'posted',
      debit: dto.lines?.reduce((s: number, l: any) => s + (l.debit || 0), 0) || 0,
      credit: dto.lines?.reduce((s: number, l: any) => s + (l.credit || 0), 0) || 0
    };
    this.journals.set([entry, ...this.journals()]);
    return of(entry);
  }

  upsertFeeStructure(fs: FeeStructurePreview) {
    const existing = this.feeStructures();
    const idx = existing.findIndex(e => e.name === fs.name && e.grade === fs.grade && e.academicYear === fs.academicYear);
    let next: FeeStructurePreview[];
    if (idx >= 0) {
      next = [...existing];
      next[idx] = fs;
    } else {
      next = [fs, ...existing];
    }
    this.feeStructures.set(next);
    return of(true);
  }

  loadPeriods() {
    return of(this.periods());
  }

  upsertPeriod(dto: { name: string; start: string; end: string }) {
    const periods = [...this.periods(), { ...dto, id: crypto.randomUUID(), status: 'planned' }];
    this.periods.set(periods);
    return of(true);
  }

  closePeriod(id: string) {
    this.periods.set(this.periods().map(p => p.id === id || p._id === id ? { ...p, status: 'closed' } : p));
    return of(true);
  }

  reopenPeriod(id: string) {
    this.periods.set(this.periods().map(p => p.id === id || p._id === id ? { ...p, status: 'open' } : p));
    return of(true);
  }

  assignFeePlan(candidateIds: string[], plan: 'full' | 'termly' | 'monthly', structureName?: string, discountPct?: number) {
    const updated = this.feeCandidates().map(c => {
      if (!candidateIds.includes(c.id)) return c;
      const customTotal = this.calcDiscountedTotal(c.baseTotal, discountPct);
      return { ...c, plan, structure: structureName || c.structure, discountPct, customTotal };
    });
    this.feeCandidates.set(updated);
    return of(true);
  }

  calcDiscountedTotal(base: number, discountPct?: number): number {
    if (!discountPct) return base;
    const pct = Math.max(0, Math.min(discountPct, 100));
    return +(base * (1 - pct / 100)).toFixed(2);
  }
}
