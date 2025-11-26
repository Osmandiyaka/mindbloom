import { Routes } from '@angular/router';

export const HR_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/hr-overview/hr-overview.component').then(m => m.HrOverviewComponent)
  },
  {
    path: 'staff',
    loadComponent: () => import('./pages/staff-directory/staff-directory.component').then(m => m.StaffDirectoryComponent)
  },
  {
    path: 'leave',
    loadComponent: () => import('./pages/leave/leave.component').then(m => m.LeaveComponent)
  }
];
