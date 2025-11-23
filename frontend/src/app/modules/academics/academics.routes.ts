import { Routes } from '@angular/router';

export const ACADEMICS_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/academics-overview/academics-overview.component').then(m => m.AcademicsOverviewComponent)
    }
];
