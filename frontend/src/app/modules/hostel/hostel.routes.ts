import { Routes } from '@angular/router';

export const HOSTEL_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/hostel-overview/hostel-overview.component').then(m => m.HostelOverviewComponent)
    },
    {
        path: 'rooms',
        loadComponent: () => import('./pages/hostel-rooms/hostel-rooms.component').then(m => m.HostelRoomsComponent)
    },
    {
        path: 'allocations',
        loadComponent: () => import('./pages/hostel-allocations/hostel-allocations.component').then(m => m.HostelAllocationsComponent)
    }
];
