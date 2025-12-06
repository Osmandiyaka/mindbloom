import { Routes } from '@angular/router';

export const HR_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'directory',
    pathMatch: 'full'
  },
  {
    path: 'directory',
    loadComponent: () => import('./pages/staff-directory/staff-directory.component').then(m => m.StaffDirectoryComponent)
  },
  {
    path: 'profiles',
    loadComponent: () => import('./pages/staff-directory/staff-directory.component').then(m => m.StaffDirectoryComponent)
  },
  {
    path: 'profile/:id',
    loadComponent: () => import('./pages/staff-profile/staff-profile.component').then(m => m.StaffProfileComponent)
  },
  {
    path: 'leave',
    loadComponent: () => import('./pages/leave/leave.component').then(m => m.LeaveComponent)
  },
  {
    path: 'attendance',
    loadComponent: () => import('./pages/hr-overview/hr-overview.component').then(m => m.HrOverviewComponent)
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages/hr-overview/hr-overview.component').then(m => m.HrOverviewComponent)
  }
];
