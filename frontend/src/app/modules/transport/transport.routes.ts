import { Routes } from '@angular/router';

export const TRANSPORT_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/transport-overview/transport-overview.component').then(m => m.TransportOverviewComponent)
    }
];
