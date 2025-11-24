import { Routes } from '@angular/router';

export const PLUGINS_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/plugin-launcher/plugin-launcher.component').then(m => m.PluginLauncherComponent)
    },
    {
        path: 'sms',
        children: [
            {
                path: '',
                redirectTo: 'settings',
                pathMatch: 'full'
            },
            {
                path: 'settings',
                loadComponent: () => import('./pages/sms-settings/sms-settings.component').then(m => m.SmsSettingsComponent)
            }
        ]
    },
    {
        path: 'library',
        loadChildren: () => import('./pages/library/library.routes').then(m => m.LIBRARY_ROUTES)
    }
];
