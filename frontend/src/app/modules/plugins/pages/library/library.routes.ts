import { Routes } from '@angular/router';

export const LIBRARY_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./pages/library-dashboard/library-dashboard.component').then(
                (m) => m.LibraryDashboardComponent
            ),
    },
    {
        path: 'catalog',
        loadComponent: () =>
            import('./pages/catalog/catalog.component').then((m) => m.CatalogComponent),
    },
    {
        path: 'books/add',
        loadComponent: () =>
            import('./pages/add-book/add-book.component').then((m) => m.AddBookComponent),
    },
    {
        path: 'books/:id',
        loadComponent: () =>
            import('./pages/book-detail/book-detail.component').then((m) => m.BookDetailComponent),
    },
    {
        path: 'circulation',
        loadComponent: () =>
            import('./pages/circulation/circulation.component').then(
                (m) => m.CirculationComponent
            ),
    },
    {
        path: 'members',
        loadComponent: () =>
            import('./pages/members/members.component').then((m) => m.MembersComponent),
    },
    {
        path: 'members/:id',
        loadComponent: () =>
            import('./pages/member-detail/member-detail.component').then(
                (m) => m.MemberDetailComponent
            ),
    },
    {
        path: 'reports',
        loadComponent: () =>
            import('./pages/reports/reports.component').then((m) => m.ReportsComponent),
    },
    {
        path: 'settings',
        loadComponent: () =>
            import('./pages/library-settings/library-settings.component').then(
                (m) => m.LibrarySettingsComponent
            ),
    },
];
