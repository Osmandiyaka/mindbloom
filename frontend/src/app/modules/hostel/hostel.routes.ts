import { Routes } from '@angular/router';

export const HOSTEL_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/hostel-overview/hostel-overview.component').then(m => m.HostelOverviewComponent)
    }
];
