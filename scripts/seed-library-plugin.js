const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mindbloom';

const libraryPlugin = {
    _id: uuidv4(),
    pluginId: 'library-barcode',
    name: 'Library Management System',
    version: '1.0.0',
    description: 'Complete library management solution with barcode scanning, book circulation, inventory tracking, fine management, member profiles, reservations, and comprehensive reporting. Perfect for schools managing physical and digital library resources.',
    author: 'MindBloom Team',
    category: 'library',
    status: 'available',
    isOfficial: true,
    iconUrl: '📚',
    bannerUrl: '',
    screenshots: [],
    price: 0,
    downloads: 0,
    rating: 5.0,
    ratingCount: 1,
    tags: ['library', 'barcode', 'books', 'circulation', 'inventory', 'catalog'],
    manifest: {
        id: 'library-barcode',
        name: 'Library Management System',
        version: '1.0.0',
        description: 'Complete library management with barcode scanning, circulation, inventory, and reporting',
        author: 'MindBloom Team',
        permissions: ['students:read', 'students:write'],
        provides: {
            routes: [
                { path: '/plugins/library/books', method: 'GET', handler: 'getBooks' },
                { path: '/plugins/library/books/:id', method: 'GET', handler: 'getBook' },
                { path: '/plugins/library/books', method: 'POST', handler: 'createBook' },
                { path: '/plugins/library/books/:id/copies', method: 'POST', handler: 'addCopies' },
                { path: '/plugins/library/circulation/scan/:barcode', method: 'GET', handler: 'scanBarcode' },
                { path: '/plugins/library/members/:id/loans', method: 'GET', handler: 'getMemberLoans' },
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
            ],
        },
    },
    changelog: [
        {
            version: '1.0.0',
            date: new Date(),
            changes: [
                'Complete book catalog management with categories',
                'Barcode scanning for quick check-in/check-out',
                'Member management synced with students/teachers/staff',
                'Book circulation tracking (issue, return, renew)',
                'Automated fine calculation for overdue books',
                'Book reservation system',
                'Comprehensive inventory management',
                'Detailed reporting and analytics',
                'Multi-copy support per book',
                'Search and filter capabilities',
            ],
        },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
};

async function seedLibraryPlugin() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected successfully');

        const db = mongoose.connection.db;
        const collection = db.collection('plugins');

        // Remove existing library plugin
        console.log('Removing existing Library plugin...');
        await collection.deleteMany({ pluginId: 'library-barcode' });

        // Insert library plugin
        console.log('Inserting Library Management plugin...');
        await collection.insertOne(libraryPlugin);

        console.log('\n✅ Successfully seeded Library Management System plugin to marketplace');
        console.log('\nPlugin:');
        console.log(`  - ${libraryPlugin.name} (${libraryPlugin.pluginId})`);
        console.log('\nFeatures:');
        console.log('  📖 Book catalog with categories and search');
        console.log('  🔍 Barcode scanning for circulation');
        console.log('  👥 Member management (students, teachers, staff)');
        console.log('  ♻️  Issue, return, and renewal workflows');
        console.log('  💰 Automated fine calculation');
        console.log('  📋 Book reservations');
        console.log('  📊 Inventory and reporting');

        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
    } catch (error) {
        console.error('Error seeding library plugin:', error);
        process.exit(1);
    }
}

seedLibraryPlugin();
