import { Routes } from '@angular/router';

export const TASKS_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/task-worklist/task-worklist.component').then(m => m.TaskWorklistComponent)
    }
];
