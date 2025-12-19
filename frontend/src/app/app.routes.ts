import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { authGuard } from './core/auth/auth.guard';
import { tenantGuard } from './core/tenant/tenant.guard';
import { permissionMatchGuard } from './core/guards/permission.guard';
import { TenantNotFoundComponent } from './pages/tenant-not-found/tenant-not-found.component';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./modules/auth/components/login-overlay/login-overlay.component').then(m => m.LoginOverlayComponent),
        data: { public: true }
    },
    {
        path: 'auth/forgot',
        loadComponent: () => import('./modules/auth/pages/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
        data: { public: true }
    },
    {
        path: 'auth/reset/:token',
        loadComponent: () => import('./modules/auth/pages/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
        data: { public: true }
    },
    {
        path: 'tenant-not-found',
        component: TenantNotFoundComponent,
        data: { public: true }
    },
    {
        path: 'select-school',
        loadComponent: () => import('./modules/tenant/pages/tenant-select/tenant-select.component').then(m => m.TenantSelectComponent),
        canActivate: [authGuard] // Auth required, but NOT tenant guard
    },
    {
        path: 'no-access',
        loadComponent: () => import('./modules/tenant/pages/no-access/no-access.component').then(m => m.NoAccessComponent),
        canActivate: [authGuard] // Auth required, but NOT tenant guard
    },
    {
        path: '',
        component: MainLayoutComponent,
        canActivate: [authGuard, tenantGuard],
        canActivateChild: [authGuard, tenantGuard],
        children: [
            {
                path: '',
                redirectTo: '/dashboard',
                pathMatch: 'full'
            },
            {
                path: 'dashboard',
                loadComponent: () => import('./modules/dashboard/pages/dashboard-workflow/dashboard-workflow.component').then(m => m.DashboardWorkflowComponent)
            },
            {
                path: 'access-denied',
                loadComponent: () => import('./core/pages/access-denied/access-denied.component').then(m => m.AccessDeniedComponent)
            },
            {
                path: 'students',
                loadChildren: () => import('./modules/students/students.routes').then(m => m.STUDENTS_ROUTES),
                canMatch: [permissionMatchGuard],
                data: { permissions: ['students:read'] }
            },
            {
                path: 'admissions',
                loadChildren: () => import('./modules/admissions/admissions.routes').then(m => m.ADMISSIONS_ROUTES),
                canMatch: [permissionMatchGuard],
                data: { permissions: ['admissions:read'] }
            },
            {
                path: 'apply',
                loadChildren: () => import('./modules/apply/apply.routes').then(m => m.APPLY_ROUTES),
                data: { public: true }
            },
            {
                path: 'academics',
                loadChildren: () => import('./modules/academics/academics.routes').then(m => m.ACADEMICS_ROUTES),
                canMatch: [permissionMatchGuard],
                data: { permissions: ['academics:read'] }
            },
            {
                path: 'attendance',
                loadChildren: () => import('./modules/attendance/attendance.routes').then(m => m.ATTENDANCE_ROUTES),
                canMatch: [permissionMatchGuard],
                data: { permissions: ['attendance:read'] }
            },
            {
                path: 'fees',
                loadChildren: () => import('./modules/fees/fees.routes').then(m => m.FEES_ROUTES),
                canMatch: [permissionMatchGuard],
                data: { permissions: ['fees:read'] }
            },
            {
                path: 'accounting',
                loadChildren: () => import('./modules/accounting/accounting.routes').then(m => m.ACCOUNTING_ROUTES),
                canMatch: [permissionMatchGuard],
                data: { permissions: ['accounting:read'] }
            },
            {
                path: 'finance',
                loadChildren: () => import('./modules/finance/finance.routes').then(m => m.FINANCE_ROUTES),
                canMatch: [permissionMatchGuard],
                data: { permissions: ['finance:read'] }
            },
            {
                path: 'hr',
                loadChildren: () => import('./modules/hr/hr.routes').then(m => m.HR_ROUTES),
                canMatch: [permissionMatchGuard],
                data: { permissions: ['hr:read'] }
            },
            {
                path: 'payroll',
                loadChildren: () => import('./modules/payroll/payroll.routes').then(m => m.PAYROLL_ROUTES),
                canMatch: [permissionMatchGuard],
                data: { permissions: ['payroll:read'] }
            },
            {
                path: 'library',
                loadChildren: () => import('./modules/library/library.routes').then(m => m.LIBRARY_ROUTES),
                canMatch: [permissionMatchGuard],
                data: { permissions: ['library:read'] }
            },
            {
                path: 'hostel',
                loadChildren: () => import('./modules/hostel/hostel.routes').then(m => m.HOSTEL_ROUTES),
                canMatch: [permissionMatchGuard],
                data: { permissions: ['hostel:read'] }
            },
            {
                path: 'transport',
                loadChildren: () => import('./modules/transport/transport.routes').then(m => m.TRANSPORT_ROUTES),
                canMatch: [permissionMatchGuard],
                data: { permissions: ['transport:read'] }
            },
            {
                path: 'roles',
                loadChildren: () => import('./modules/roles/roles.routes').then(m => m.rolesRoutes),
                canMatch: [permissionMatchGuard],
                data: { permissions: ['roles:read'] }
            },
            {
                path: 'tasks',
                loadChildren: () => import('./modules/tasks/tasks.routes').then(m => m.TASKS_ROUTES),
                canMatch: [permissionMatchGuard],
                data: { permissions: ['tasks:read'] }
            },
            {
                path: 'setup',
                loadChildren: () => import('./modules/setup/setup.routes').then(m => m.SETUP_ROUTES),
                canMatch: [permissionMatchGuard],
                data: { permissions: ['setup:read'] }
            },
            {
                path: 'plugins',
                loadChildren: () => import('./modules/plugins/plugins.routes').then(m => m.PLUGINS_ROUTES)
            }
        ]
    },
    {
        path: '**',
        redirectTo: '/dashboard'
    }
];
