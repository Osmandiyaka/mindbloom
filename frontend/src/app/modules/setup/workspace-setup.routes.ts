import { Routes } from '@angular/router';
import { WorkspaceSetupShellComponent } from './components/workspace-setup-shell.component';

export const WORKSPACE_SETUP_ROUTES: Routes = [
  {
    path: '',
    component: WorkspaceSetupShellComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'schools'
      },
      {
        path: 'schools',
        loadComponent: () =>
          import('./pages/tenant-workspace-setup/school/school-setup.component').then(m => m.TenantSchoolsComponent)
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/tenant-workspace-setup/users/users-setup.component').then(m => m.TenantUsersComponent)
      },
      {
        path: 'org-units',
        loadComponent: () =>
          import('./pages/tenant-workspace-setup/org-units/org-units.component').then(m => m.TenantWorkspaceSetupOrgUnitsComponent)
      },
      {
        path: 'academic-structure',
        loadComponent: () =>
          import('./pages/tenant-workspace-setup/levels/tenant-workspace-setup-levels.component').then(m => m.TenantWorkspaceSetupLevelsComponent)
      },
      {
        path: 'classes-sections',
        loadComponent: () =>
          import('./pages/tenant-workspace-setup/classes-sections/tenant-workspace-setup-classes-sections.component').then(m => m.TenantWorkspaceSetupClassesSectionsComponent)
      },
      {
        path: 'grading-system',
        loadComponent: () =>
          import('./pages/tenant-workspace-setup/grading/tenant-workspace-setup-grading.component').then(m => m.TenantWorkspaceSetupGradingComponent)
      },
    ]
  }
];
