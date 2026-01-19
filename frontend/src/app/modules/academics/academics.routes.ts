import { Routes } from '@angular/router';

export const ACADEMICS_ROUTES: Routes = [
    {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./pages/academics-overview/academics-overview.component').then(m => m.AcademicsOverviewComponent)
    },
    {
        path: 'classes-sections',
        loadComponent: () => import('./pages/classes-sections/classes-sections.component').then(m => m.ClassesSectionsComponent)
    }
];
