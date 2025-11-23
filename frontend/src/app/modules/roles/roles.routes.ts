import { Routes } from '@angular/router';
import { RoleListComponent } from './role-list/role-list.component';
import { RoleFormComponent } from './role-form/role-form.component';

export const rolesRoutes: Routes = [
    {
        path: '',
        component: RoleListComponent
    },
    {
        path: 'create',
        component: RoleFormComponent
    },
    {
        path: ':id/edit',
        component: RoleFormComponent
    }
];
