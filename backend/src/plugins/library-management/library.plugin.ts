import { Injectable, Logger } from '@nestjs/common';
import { IPlugin, PluginManifest, PluginPermission } from '../../core/plugins/plugin.interface';
import { PluginContext } from '../../core/plugins/plugin.context';
import { EventBus } from '../../core/plugins/event-bus.service';

@Injectable()
export class LibraryManagementPlugin implements IPlugin {
    private readonly logger = new Logger(LibraryManagementPlugin.name);
    public readonly manifest: PluginManifest = {
        id: 'library-management',
        name: 'Library Management System',
        version: '1.0.0',
        description: 'Complete library management with barcode scanning, circulation, inventory, and reporting',
        author: 'MindBloom Team',
        permissions: [
            PluginPermission.READ_STUDENTS,
            PluginPermission.WRITE_STUDENTS,
        ] as PluginPermission[],
        provides: {
            routes: [
                // Books
                { path: '/plugins/library/books', method: 'GET', handler: 'getBooks' },
                { path: '/plugins/library/books/:id', method: 'GET', handler: 'getBook' },
                { path: '/plugins/library/books', method: 'POST', handler: 'createBook' },
                { path: '/plugins/library/books/:id', method: 'PUT', handler: 'updateBook' },
                { path: '/plugins/library/books/:id', method: 'DELETE', handler: 'deleteBook' },
                { path: '/plugins/library/books/isbn/:isbn', method: 'GET', handler: 'getBookByISBN' },
                { path: '/plugins/library/books/:id/copies', method: 'POST', handler: 'addCopies' },

                // Categories
                { path: '/plugins/library/categories', method: 'GET', handler: 'getCategories' },
                { path: '/plugins/library/categories', method: 'POST', handler: 'createCategory' },
                { path: '/plugins/library/categories/:id', method: 'PUT', handler: 'updateCategory' },
                { path: '/plugins/library/categories/:id', method: 'DELETE', handler: 'deleteCategory' },

                // Circulation
                { path: '/plugins/library/circulation/issue', method: 'POST', handler: 'issueBook' },
                { path: '/plugins/library/circulation/return', method: 'POST', handler: 'returnBook' },
                { path: '/plugins/library/circulation/renew', method: 'POST', handler: 'renewBook' },
                { path: '/plugins/library/circulation/transactions', method: 'GET', handler: 'getTransactions' },
                { path: '/plugins/library/circulation/overdue', method: 'GET', handler: 'getOverdueBooks' },
                { path: '/plugins/library/circulation/scan/:barcode', method: 'GET', handler: 'scanBarcode' },

                // Members
                { path: '/plugins/library/members', method: 'GET', handler: 'getMembers' },
                { path: '/plugins/library/members/:id', method: 'GET', handler: 'getMember' },
                { path: '/plugins/library/members/:id/loans', method: 'GET', handler: 'getMemberLoans' },
                { path: '/plugins/library/members/:id/history', method: 'GET', handler: 'getMemberHistory' },
                { path: '/plugins/library/members/:id/fines', method: 'GET', handler: 'getMemberFines' },

                // Reservations
                { path: '/plugins/library/reservations', method: 'GET', handler: 'getReservations' },
                { path: '/plugins/library/reservations', method: 'POST', handler: 'createReservation' },
                { path: '/plugins/library/reservations/:id', method: 'DELETE', handler: 'cancelReservation' },
                { path: '/plugins/library/reservations/:id/fulfill', method: 'POST', handler: 'fulfillReservation' },

                // Fines
                { path: '/plugins/library/fines', method: 'GET', handler: 'getFines' },
                { path: '/plugins/library/fines/:id/pay', method: 'POST', handler: 'payFine' },
                { path: '/plugins/library/fines/:id/waive', method: 'POST', handler: 'waiveFine' },

                // Reports
                { path: '/plugins/library/reports/circulation', method: 'GET', handler: 'getCirculationReport' },
                { path: '/plugins/library/reports/inventory', method: 'GET', handler: 'getInventoryReport' },
                { path: '/plugins/library/reports/fines', method: 'GET', handler: 'getFinesReport' },
                { path: '/plugins/library/reports/popular-books', method: 'GET', handler: 'getPopularBooksReport' },
                { path: '/plugins/library/reports/member-activity', method: 'GET', handler: 'getMemberActivityReport' },

                // Public Catalog
                { path: '/plugins/library/catalog/search', method: 'GET', handler: 'searchCatalog' },
                { path: '/plugins/library/catalog/my-loans', method: 'GET', handler: 'getMyLoans' },
                { path: '/plugins/library/catalog/my-reservations', method: 'GET', handler: 'getMyReservations' },
                { path: '/plugins/library/catalog/my-fines', method: 'GET', handler: 'getMyFines' },
            ],
            menuItems: [
                {
                    label: 'Library',
                    icon: '📚',
                    route: '/plugins/library',
                },
            ],
            settings: [
                { key: 'loanDurationDays', label: 'Default Loan Duration (Days)', type: 'number', defaultValue: 14 },
                { key: 'maxBooksPerMember', label: 'Max Books Per Member', type: 'number', defaultValue: 5 },
                { key: 'finePerDay', label: 'Fine Per Day (Currency)', type: 'number', defaultValue: 1 },
                { key: 'maxFineBeforeBlock', label: 'Max Fine Before Block', type: 'number', defaultValue: 50 },
                { key: 'allowRenewals', label: 'Allow Book Renewals', type: 'boolean', defaultValue: true },
                { key: 'maxRenewals', label: 'Max Renewals Per Book', type: 'number', defaultValue: 2 },
                { key: 'enableReservations', label: 'Enable Book Reservations', type: 'boolean', defaultValue: true },
                { key: 'reservationExpiryHours', label: 'Reservation Expiry (Hours)', type: 'number', defaultValue: 48 },
                { key: 'enableBarcode', label: 'Enable Barcode Scanning', type: 'boolean', defaultValue: true },
                { key: 'barcodePrefix', label: 'Barcode Prefix', type: 'text', defaultValue: 'LIB' },
                { key: 'enableOverdueNotifications', label: 'Enable Overdue Notifications', type: 'boolean', defaultValue: true },
                { key: 'overdueNotificationDays', label: 'Overdue Notification Interval (Days)', type: 'number', defaultValue: 3 },
                { key: 'workingDaysOnly', label: 'Count Working Days Only', type: 'boolean', defaultValue: false },
                { key: 'weekendDays', label: 'Weekend Days (comma-separated)', type: 'text', defaultValue: 'Saturday,Sunday' },
            ],
        },
    };

    constructor() { }

    async onInstall(context: PluginContext): Promise<void> {
        const tenantId = context.tenantId;
        this.logger.log(`Installing Library Management plugin for tenant: ${tenantId}`);

        // Collections will be created automatically by Mongoose when first document is inserted

        this.logger.log('Library Management plugin installed successfully');
    }

    async onEnable(context: PluginContext): Promise<void> {
        const tenantId = context.tenantId;
        this.logger.log(`Enabling Library Management plugin for tenant: ${tenantId}`);

        // TODO: Subscribe to student enrollment events when EventBus is properly configured
        // this.eventBus.subscribe(tenantId, 'student.enrolled', this.handleStudentEnrolled.bind(this));
        // this.eventBus.subscribe(tenantId, 'student.withdrawn', this.handleStudentWithdrawn.bind(this));

        this.logger.log('Library Management plugin enabled');
    }

    async onDisable(context: PluginContext): Promise<void> {
        const tenantId = context.tenantId;
        this.logger.log(`Disabling Library Management plugin for tenant: ${tenantId}`);

        // TODO: Unsubscribe from events when EventBus is properly configured
        // this.eventBus.unsubscribe(tenantId, 'student.enrolled');
        // this.eventBus.unsubscribe(tenantId, 'student.withdrawn');

        this.logger.log('Library Management plugin disabled');
    }

    async onUninstall(context: PluginContext): Promise<void> {
        const tenantId = context.tenantId;
        this.logger.log(`Uninstalling Library Management plugin for tenant: ${tenantId}`);

        // Note: In production, you might want to archive data rather than delete
        // For now, we'll just log the uninstall
        this.logger.warn('Library data retained. Manual cleanup required if needed.');
    }

    private async handleStudentEnrolled(event: any): Promise<void> {
        this.logger.log(`Student enrolled event received: ${event.studentId}`);
        // Auto-create library member profile for new student
        // This would be implemented in the service layer
    }

    private async handleStudentWithdrawn(event: any): Promise<void> {
        this.logger.log(`Student withdrawn event received: ${event.studentId}`);
        // Check for unreturned books and outstanding fines
        // Send notifications if needed
    }
}
