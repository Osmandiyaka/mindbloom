import { Routes } from '@angular/router';

export const ACCOUNTING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/accounting-overview/accounting-overview.component').then(m => m.AccountingOverviewComponent)
  },
  {
    path: 'accounts',
    loadComponent: () => import('./pages/accounts/accounts.component').then(m => m.AccountsComponent)
  },
  {
    path: 'journals',
    loadComponent: () => import('./pages/journals/journals.component').then(m => m.JournalsComponent)
  },
  {
    path: 'trial-balance',
    loadComponent: () => import('./pages/trial-balance/trial-balance.component').then(m => m.TrialBalanceComponent)
  },
  {
    path: 'periods',
    loadComponent: () => import('./pages/periods/periods.component').then(m => m.PeriodsComponent)
  },
  {
    path: 'fee-structures',
    loadComponent: () => import('./pages/fee-structures/fee-structures.component').then(m => m.FeeStructuresComponent)
  },
  {
    path: 'collection',
    loadComponent: () => import('./pages/collection/collection.component').then(m => m.CollectionComponent)
  },
  {
    path: 'reports',
    loadComponent: () => import('./pages/report-center/report-center.component').then(m => m.ReportCenterComponent)
  }
];
