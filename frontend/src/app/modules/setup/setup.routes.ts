import { Routes } from '@angular/router';

export const SETUP_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/setup-overview/setup-overview.component').then(m => m.SetupOverviewComponent)
    }
];
