import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';

export const STUDENTS_ROUTES: Routes = [
    {
        path: 'dashboard',
        loadComponent: () => import('./pages/student-dashboard/student-dashboard.component').then(m => m.StudentDashboardComponent)
    },
    {
        path: 'admissions',
        loadComponent: () => import('./pages/student-admissions/student-admissions.component').then(m => m.StudentAdmissionsComponent)
    },
    {
        path: 'attendance',
        loadComponent: () => import('./pages/student-attendance/student-attendance.component').then(m => m.StudentAttendanceComponent)
    },
    {
        path: 'academics',
        loadComponent: () => import('./pages/student-academics/student-academics.component').then(m => m.StudentAcademicsComponent)
    },
    {
        path: 'conduct',
        loadComponent: () => import('./pages/student-conduct/student-conduct.component').then(m => m.StudentConductComponent)
    },
    {
        path: 'reports',
        loadComponent: () => import('./pages/student-reports/student-reports.component').then(m => m.StudentReportsComponent)
    },
    {
        path: '',
        loadComponent: () => import('./pages/student-workspace/student-workspace.component').then(m => m.StudentWorkspaceComponent)
    },
    {
        path: 'roster',
        loadComponent: () => import('./pages/students-list/students-list.component').then(m => m.StudentsListComponent)
    },
    {
        path: 'import',
        loadComponent: () => import('./pages/student-import/student-import.component').then(m => m.StudentImportComponent)
    },
    {
        path: 'new',
        loadComponent: () => import('../setup/pages/students/student-form/student-form.component').then(m => m.StudentFormComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['students:create'] }
    },
    {
        path: ':id/edit',
        loadComponent: () => import('../setup/pages/students/student-form/student-form.component').then(m => m.StudentFormComponent),
        canActivate: [permissionGuard],
        data: { permissions: ['students:update'] }
    },
    {
        path: ':id',
        loadComponent: () => import('./pages/student-detail/student-detail.component').then(m => m.StudentDetailComponent)
    }
];
