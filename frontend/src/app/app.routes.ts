import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';

export const routes: Routes = [
    {
        path: '',
        component: MainLayoutComponent,
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
                path: 'students',
                loadChildren: () => import('./modules/students/students.routes').then(m => m.STUDENTS_ROUTES)
            },
            {
                path: 'admissions',
                loadChildren: () => import('./modules/admissions/admissions.routes').then(m => m.ADMISSIONS_ROUTES)
            },
            {
                path: 'apply',
                loadChildren: () => import('./modules/apply/apply.routes').then(m => m.APPLY_ROUTES)
            },
            {
                path: 'academics',
                loadChildren: () => import('./modules/academics/academics.routes').then(m => m.ACADEMICS_ROUTES)
            },
            {
                path: 'attendance',
                loadChildren: () => import('./modules/attendance/attendance.routes').then(m => m.ATTENDANCE_ROUTES)
            },
            {
                path: 'fees',
                loadChildren: () => import('./modules/fees/fees.routes').then(m => m.FEES_ROUTES)
            },
            {
                path: 'accounting',
                loadChildren: () => import('./modules/accounting/accounting.routes').then(m => m.ACCOUNTING_ROUTES)
            },
            {
                path: 'finance',
                loadChildren: () => import('./modules/finance/finance.routes').then(m => m.FINANCE_ROUTES)
            },
            {
                path: 'hr',
                loadChildren: () => import('./modules/hr/hr.routes').then(m => m.HR_ROUTES)
            },
            {
                path: 'payroll',
                loadChildren: () => import('./modules/payroll/payroll.routes').then(m => m.PAYROLL_ROUTES)
            },
            {
                path: 'library',
                loadChildren: () => import('./modules/library/library.routes').then(m => m.LIBRARY_ROUTES)
            },
            {
                path: 'hostel',
                loadChildren: () => import('./modules/hostel/hostel.routes').then(m => m.HOSTEL_ROUTES)
            },
            {
                path: 'transport',
                loadChildren: () => import('./modules/transport/transport.routes').then(m => m.TRANSPORT_ROUTES)
            },
            {
                path: 'roles',
                loadChildren: () => import('./modules/roles/roles.routes').then(m => m.rolesRoutes)
            },
            {
                path: 'tasks',
                loadChildren: () => import('./modules/tasks/tasks.routes').then(m => m.TASKS_ROUTES)
            },
            {
                path: 'setup',
                loadChildren: () => import('./modules/setup/setup.routes').then(m => m.SETUP_ROUTES)
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
