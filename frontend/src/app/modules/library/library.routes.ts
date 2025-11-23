import { Routes } from '@angular/router';

export const LIBRARY_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/library-overview/library-overview.component').then(m => m.LibraryOverviewComponent)
    }
];
