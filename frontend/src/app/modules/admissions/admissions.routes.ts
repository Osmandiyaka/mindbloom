import { Routes } from '@angular/router';

export const ADMISSIONS_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/admissions-dashboard/admissions-dashboard.component').then(m => m.AdmissionsDashboardComponent)
    },
    {
        path: 'apply',
        loadComponent: () => import('./pages/application-form/application-form.component').then(m => m.ApplicationFormComponent)
    }
];
