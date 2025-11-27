import { Routes } from '@angular/router';

export const ADMISSIONS_ROUTES: Routes = [
    {
        path: '',
        redirectTo: 'pipeline',
        pathMatch: 'full'
    },
    {
        path: 'dashboard',
        loadComponent: () => import('./pages/admissions-dashboard/admissions-dashboard.component').then(m => m.AdmissionsDashboardComponent)
    },
    {
        path: 'pipeline',
        loadComponent: () => import('./pages/admissions-pipeline/admissions-pipeline.component').then(m => m.AdmissionsPipelineComponent)
    },
    {
        path: 'apply',
        loadComponent: () => import('./pages/application-form/application-form.component').then(m => m.ApplicationFormComponent)
    },
    {
        path: ':id',
        loadComponent: () => import('./pages/application-detail/application-detail.component').then(m => m.ApplicationDetailComponent)
    }
];
