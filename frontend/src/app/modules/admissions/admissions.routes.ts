import { Routes } from '@angular/router';

export const ADMISSIONS_ROUTES: Routes = [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    {
        path: 'dashboard',
        loadComponent: () => import('./pages/admissions-dashboard/admissions-dashboard.component').then(m => m.AdmissionsDashboardComponent)
    },
    // Walk-in
    {
        path: 'walk-in/new',
        loadComponent: () => import('./pages/walk-in-new/walk-in-new.component').then(m => m.WalkInNewComponent)
    },
    {
        path: 'walk-in/list',
        loadComponent: () => import('./pages/walk-in-list/walk-in-list.component').then(m => m.WalkInListComponent)
    },
    {
        path: 'walk-in/receipt/:id',
        loadComponent: () => import('./pages/walk-in-receipt/walk-in-receipt.component').then(m => m.WalkInReceiptComponent)
    },
    // Online
    {
        path: 'online/applications',
        loadComponent: () => import('./pages/online-applications/online-applications.component').then(m => m.OnlineApplicationsComponent)
    },
    {
        path: 'online/review/:id',
        loadComponent: () => import('./pages/online-review/online-review.component').then(m => m.OnlineReviewComponent)
    },
    {
        path: 'online/analytics',
        loadComponent: () => import('./pages/online-analytics/online-analytics.component').then(m => m.OnlineAnalyticsComponent)
    },
    // Prospectus
    {
        path: 'prospectus/sell',
        loadComponent: () => import('./pages/prospectus-sell/prospectus-sell.component').then(m => m.ProspectusSellComponent)
    },
    {
        path: 'prospectus/inventory',
        loadComponent: () => import('./pages/prospectus-inventory/prospectus-inventory.component').then(m => m.ProspectusInventoryComponent)
    },
    // Reports
    {
        path: 'reports/daily',
        loadComponent: () => import('./pages/reports-daily/reports-daily.component').then(m => m.ReportsDailyComponent)
    },
    {
        path: 'reports/collection',
        loadComponent: () => import('./pages/reports-collection/reports-collection.component').then(m => m.ReportsCollectionComponent)
    },
    {
        path: 'reports/conversion',
        loadComponent: () => import('./pages/reports-conversion/reports-conversion.component').then(m => m.ReportsConversionComponent)
    },
    // Settings
    {
        path: 'settings/rounds',
        loadComponent: () => import('./pages/settings-rounds/settings-rounds.component').then(m => m.SettingsRoundsComponent)
    },
    {
        path: 'settings/criteria',
        loadComponent: () => import('./pages/settings-criteria/settings-criteria.component').then(m => m.SettingsCriteriaComponent)
    },
    {
        path: 'settings/templates',
        loadComponent: () => import('./pages/settings-templates/settings-templates.component').then(m => m.SettingsTemplatesComponent)
    },
];
