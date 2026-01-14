import { RoleListComponent } from './role-list/role-list.component';
import { Routes } from '@angular/router';

export const rolesRoutes: Routes = [
    {
        path: '',
        component: RoleListComponent
    },
    {
        path: 'create',
        redirectTo: '',
        pathMatch: 'full'
    },
    {
        path: ':id/edit',
        redirectTo: '',
        pathMatch: 'full'
    }
];
