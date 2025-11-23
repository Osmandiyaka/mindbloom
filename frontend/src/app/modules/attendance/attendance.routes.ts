import { Routes } from '@angular/router';

export const ATTENDANCE_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/attendance-overview/attendance-overview.component').then(m => m.AttendanceOverviewComponent)
    }
];
