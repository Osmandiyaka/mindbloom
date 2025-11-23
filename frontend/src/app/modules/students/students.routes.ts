import { Routes } from '@angular/router';

export const STUDENTS_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/students-list/students-list.component').then(m => m.StudentsListComponent)
    },
    {
        path: 'new',
        loadComponent: () => import('../setup/pages/students/student-form/student-form.component').then(m => m.StudentFormComponent)
    },
    {
        path: ':id/edit',
        loadComponent: () => import('../setup/pages/students/student-form/student-form.component').then(m => m.StudentFormComponent)
    },
    {
        path: ':id',
        loadComponent: () => import('./pages/student-detail/student-detail.component').then(m => m.StudentDetailComponent)
    }
];
