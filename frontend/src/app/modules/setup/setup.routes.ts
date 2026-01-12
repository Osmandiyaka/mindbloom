import { Routes } from '@angular/router';

export const SETUP_ROUTES: Routes = [
    {
        path: 'first-login',
        loadComponent: () =>
            import('./pages/first-login-setup/tenant-workspace-setup.component').then(m => m.TenantWorkspaceSetupComponent)
    },
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
    },
    {
        path: 'users',
        loadComponent: () => import('./pages/users/user-list.component').then(m => m.UserListComponent)
    },
    {
        path: 'users/create',
        loadComponent: () => import('./pages/users/user-form.component').then(m => m.UserFormComponent)
    },
    {
        path: 'users/edit/:id',
        loadComponent: () => import('./pages/users/user-form.component').then(m => m.UserFormComponent)
    },
    {
        path: 'marketplace',
        loadComponent: () => import('./pages/marketplace/marketplace.component').then(m => m.MarketplaceComponent)
    },
    {
        path: 'school-settings',
        loadComponent: () => import('./pages/school-settings/school-settings.component').then(m => m.SchoolSettingsComponent)
    },
    {
        path: 'marketplace/:id',
        loadComponent: () => import('./pages/plugin-detail/plugin-detail.component').then(m => m.PluginDetailComponent)
    },
    {
        path: 'tenant-settings',
        loadComponent: () => import('./pages/tenant-settings/tenant-settings.component').then(m => m.TenantSettingsComponent)
    },
    {
        path: 'students',
        loadComponent: () => import('./pages/students/student-list/student-list.component').then(m => m.StudentListComponent)
    }
];
