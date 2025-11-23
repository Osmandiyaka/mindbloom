import { Routes } from '@angular/router';

export const SETUP_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/setup-overview/setup-overview.component').then(m => m.SetupOverviewComponent)
    },
    {
        path: 'roles',
        loadComponent: () => import('./pages/roles/role-list.component').then(m => m.RoleListComponent)
    },
    {
        path: 'roles/create',
        loadComponent: () => import('./pages/roles/role-form.component').then(m => m.RoleFormComponent)
    },
    {
        path: 'roles/:id/edit',
        loadComponent: () => import('./pages/roles/role-form.component').then(m => m.RoleFormComponent)
    }
];
