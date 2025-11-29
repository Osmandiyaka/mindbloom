import { Routes } from '@angular/router';

export const APPLY_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./pages/apply-landing/apply-landing.component').then(m => m.ApplyLandingComponent) },
  { path: 'prospectus', loadComponent: () => import('./pages/apply-prospectus/apply-prospectus.component').then(m => m.ApplyProspectusComponent) },
  { path: 'check-eligibility', loadComponent: () => import('./pages/check-eligibility/check-eligibility.component').then(m => m.CheckEligibilityComponent) },
  { path: 'application/new', loadComponent: () => import('./pages/application-new/application-new.component').then(m => m.ApplicationNewComponent) },
  { path: 'application/continue/:id', loadComponent: () => import('./pages/application-continue/application-continue.component').then(m => m.ApplicationContinueComponent) },
  { path: 'application/status/:id', loadComponent: () => import('./pages/application-status/application-status.component').then(m => m.ApplicationStatusComponent) },
  { path: 'help', loadComponent: () => import('./pages/apply-help/apply-help.component').then(m => m.ApplyHelpComponent) },
];
