const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mindbloom';

const samplePlugins = [
    {
        _id: uuidv4(),
        pluginId: 'sms-twilio',
        name: 'Twilio SMS Gateway',
        version: '1.0.0',
        description: 'Send SMS notifications to students and parents using Twilio. Supports bulk messaging, scheduled messages, and message templates.',
        author: 'MindBloom Team',
        category: 'communication',
        status: 'available',
        isOfficial: true,
        iconUrl: '📱',
        bannerUrl: '',
        screenshots: [],
        price: 0,
        downloads: 1250,
        rating: 4.8,
        ratingCount: 87,
        tags: ['sms', 'communication', 'notifications', 'twilio'],
        manifest: {
            id: 'sms-twilio',
            permissions: ['communications:sms:send', 'students:read'],
            provides: {
                routes: [
                    { path: '/plugins/sms/send', method: 'POST', handler: 'sendSMS' },
                    { path: '/plugins/sms/send-bulk', method: 'POST', handler: 'sendBulkSMS' },
                    { path: '/plugins/sms/templates', method: 'GET', handler: 'getTemplates' },
                    { path: '/plugins/sms/history', method: 'GET', handler: 'getHistory' },
                ],
                menuItems: [
                    {
                        label: 'SMS Notifications',
                        icon: '📱',
                        route: '/plugins/sms',
                        parent: 'communications',
                        order: 10,
                    },
                ],
            },
            settings: [
                { key: 'accountSid', label: 'Twilio Account SID', type: 'text', required: true },
                { key: 'authToken', label: 'Twilio Auth Token', type: 'password', required: true },
                { key: 'fromNumber', label: 'From Phone Number', type: 'text', required: true },
                { key: 'enableFeeReminders', label: 'Enable Fee Reminders', type: 'boolean', defaultValue: true },
                { key: 'enableAttendanceAlerts', label: 'Enable Attendance Alerts', type: 'boolean', defaultValue: true },
            ],
        },
        changelog: [
            {
                version: '1.0.0',
                date: new Date('2024-01-15'),
                changes: ['Initial release', 'Support for individual and bulk SMS', 'Message templates'],
            },
        ],
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
    },
    {
        _id: uuidv4(),
        pluginId: 'email-sendgrid',
        name: 'SendGrid Email Service',
        version: '1.2.0',
        description: 'Professional email delivery service powered by SendGrid. Send automated emails, newsletters, and notifications with tracking and analytics.',
        author: 'MindBloom Team',
        category: 'communication',
        status: 'available',
        isOfficial: true,
        iconUrl: '📧',
        bannerUrl: '',
        screenshots: [],
        price: 0,
        downloads: 2100,
        rating: 4.9,
        ratingCount: 156,
        tags: ['email', 'communication', 'sendgrid', 'notifications'],
        manifest: {
            id: 'email-sendgrid',
            permissions: ['communications:email:send', 'students:read'],
            settings: [
                { key: 'apiKey', label: 'SendGrid API Key', type: 'password', required: true },
                { key: 'fromEmail', label: 'From Email Address', type: 'text', required: true },
                { key: 'fromName', label: 'From Name', type: 'text', required: true },
            ],
        },
        changelog: [
            {
                version: '1.2.0',
                date: new Date('2024-11-01'),
                changes: ['Added email templates', 'Improved delivery tracking', 'Bug fixes'],
            },
            {
                version: '1.0.0',
                date: new Date('2024-02-10'),
                changes: ['Initial release'],
            },
        ],
        createdAt: new Date('2024-02-10'),
        updatedAt: new Date('2024-11-01'),
    },
    {
        _id: uuidv4(),
        pluginId: 'payment-stripe',
        name: 'Stripe Payment Gateway',
        version: '2.0.1',
        description: 'Accept online fee payments via Stripe. Supports credit cards, debit cards, and digital wallets. Automatic receipt generation and payment tracking.',
        author: 'MindBloom Team',
        category: 'payment',
        status: 'available',
        isOfficial: true,
        iconUrl: '💳',
        bannerUrl: '',
        screenshots: [],
        price: 0,
        downloads: 3450,
        rating: 4.7,
        ratingCount: 234,
        tags: ['payment', 'stripe', 'fees', 'online-payment'],
        manifest: {
            id: 'payment-stripe',
            permissions: ['fees:payments:process', 'fees:read', 'fees:write'],
            settings: [
                { key: 'publishableKey', label: 'Stripe Publishable Key', type: 'text', required: true },
                { key: 'secretKey', label: 'Stripe Secret Key', type: 'password', required: true },
                { key: 'webhookSecret', label: 'Webhook Secret', type: 'password', required: false },
                {
                    key: 'currency', label: 'Currency', type: 'select', options: [
                        { label: 'USD', value: 'usd' },
                        { label: 'EUR', value: 'eur' },
                        { label: 'GBP', value: 'gbp' },
                        { label: 'NGN', value: 'ngn' },
                    ], defaultValue: 'usd'
                },
            ],
        },
        changelog: [
            {
                version: '2.0.1',
                date: new Date('2024-11-15'),
                changes: ['Security improvements', 'Updated Stripe SDK'],
            },
        ],
        createdAt: new Date('2024-03-01'),
        updatedAt: new Date('2024-11-15'),
    },
    {
        _id: uuidv4(),
        pluginId: 'analytics-dashboard',
        name: 'Advanced Analytics Dashboard',
        version: '1.1.0',
        description: 'Comprehensive analytics and reporting dashboard. Track student performance, attendance trends, fee collection, and generate custom reports with beautiful charts.',
        author: 'Analytics Pro',
        category: 'analytics',
        status: 'available',
        isOfficial: false,
        iconUrl: '📊',
        bannerUrl: '',
        screenshots: [],
        price: 29.99,
        downloads: 890,
        rating: 4.6,
        ratingCount: 67,
        tags: ['analytics', 'reports', 'dashboard', 'charts'],
        manifest: {
            id: 'analytics-dashboard',
            permissions: ['students:read', 'fees:read', 'system:audit:read'],
            settings: [
                { key: 'refreshInterval', label: 'Data Refresh Interval (minutes)', type: 'number', defaultValue: 5 },
                { key: 'enableRealTime', label: 'Enable Real-time Updates', type: 'boolean', defaultValue: true },
            ],
        },
        changelog: [
            {
                version: '1.1.0',
                date: new Date('2024-10-20'),
                changes: ['Added new chart types', 'Performance improvements'],
            },
        ],
        createdAt: new Date('2024-04-15'),
        updatedAt: new Date('2024-10-20'),
    },
    {
        _id: uuidv4(),
        pluginId: 'attendance-biometric',
        name: 'Biometric Attendance',
        version: '1.0.0',
        description: 'Integrate biometric devices for automated attendance tracking. Supports fingerprint scanners and facial recognition. Real-time sync and anti-spoofing.',
        author: 'SecureID Systems',
        category: 'attendance',
        status: 'available',
        isOfficial: false,
        iconUrl: '👆',
        bannerUrl: '',
        screenshots: [],
        price: 99.99,
        downloads: 456,
        rating: 4.5,
        ratingCount: 34,
        tags: ['attendance', 'biometric', 'security', 'automation'],
        manifest: {
            id: 'attendance-biometric',
            permissions: ['students:read', 'students:write'],
            settings: [
                {
                    key: 'deviceType', label: 'Device Type', type: 'select', options: [
                        { label: 'Fingerprint Scanner', value: 'fingerprint' },
                        { label: 'Face Recognition', value: 'face' },
                    ]
                },
                { key: 'deviceIp', label: 'Device IP Address', type: 'text', required: true },
                { key: 'autoSync', label: 'Auto Sync', type: 'boolean', defaultValue: true },
            ],
        },
        changelog: [
            {
                version: '1.0.0',
                date: new Date('2024-09-01'),
                changes: ['Initial release', 'Support for major biometric devices'],
            },
        ],
        createdAt: new Date('2024-09-01'),
        updatedAt: new Date('2024-09-01'),
    },
    {
        _id: uuidv4(),
        pluginId: 'report-generator',
        name: 'Custom Report Generator',
        version: '2.1.0',
        description: 'Create custom reports with drag-and-drop builder. Export to PDF, Excel, or CSV. Schedule automated report generation and email delivery.',
        author: 'ReportPro Inc',
        category: 'reporting',
        status: 'available',
        isOfficial: false,
        iconUrl: '📄',
        bannerUrl: '',
        screenshots: [],
        price: 49.99,
        downloads: 1567,
        rating: 4.8,
        ratingCount: 123,
        tags: ['reports', 'pdf', 'excel', 'automation'],
        manifest: {
            id: 'report-generator',
            permissions: ['students:read', 'fees:read'],
            settings: [
                {
                    key: 'defaultFormat', label: 'Default Export Format', type: 'select', options: [
                        { label: 'PDF', value: 'pdf' },
                        { label: 'Excel', value: 'xlsx' },
                        { label: 'CSV', value: 'csv' },
                    ]
                },
                { key: 'includeLogo', label: 'Include School Logo', type: 'boolean', defaultValue: true },
            ],
        },
        changelog: [
            {
                version: '2.1.0',
                date: new Date('2024-11-10'),
                changes: ['Added Excel export', 'New report templates', 'Performance improvements'],
            },
        ],
        createdAt: new Date('2024-05-20'),
        updatedAt: new Date('2024-11-10'),
    },
    {
        _id: uuidv4(),
        pluginId: 'library-barcode',
        name: 'Library Barcode Scanner',
        version: '1.0.0',
        description: 'Streamline library book checkout and returns with barcode scanning. Track book inventory, issue/return dates, and overdue notifications.',
        author: 'LibraryTech',
        category: 'library',
        status: 'available',
        isOfficial: false,
        iconUrl: '📚',
        bannerUrl: '',
        screenshots: [],
        price: 19.99,
        downloads: 678,
        rating: 4.4,
        ratingCount: 45,
        tags: ['library', 'barcode', 'books', 'inventory'],
        manifest: {
            id: 'library-barcode',
            permissions: ['students:read'],
            settings: [
                {
                    key: 'scannerType', label: 'Scanner Type', type: 'select', options: [
                        { label: 'USB Scanner', value: 'usb' },
                        { label: 'Camera', value: 'camera' },
                    ]
                },
                { key: 'overdueNotifications', label: 'Enable Overdue Notifications', type: 'boolean', defaultValue: true },
            ],
        },
        changelog: [
            {
                version: '1.0.0',
                date: new Date('2024-08-15'),
                changes: ['Initial release'],
            },
        ],
        createdAt: new Date('2024-08-15'),
        updatedAt: new Date('2024-08-15'),
    },
    {
        _id: uuidv4(),
        pluginId: 'push-notifications',
        name: 'Push Notifications',
        version: '1.3.0',
        description: 'Send real-time push notifications to mobile apps and web browsers. Instant alerts for important updates, announcements, and reminders.',
        author: 'MindBloom Team',
        category: 'communication',
        status: 'available',
        isOfficial: true,
        iconUrl: '🔔',
        bannerUrl: '',
        screenshots: [],
        price: 0,
        downloads: 1890,
        rating: 4.7,
        ratingCount: 112,
        tags: ['notifications', 'push', 'mobile', 'real-time'],
        manifest: {
            id: 'push-notifications',
            permissions: ['communications:notifications:send', 'students:read'],
            settings: [
                { key: 'fcmServerKey', label: 'Firebase Server Key', type: 'password', required: true },
                { key: 'soundEnabled', label: 'Enable Sound', type: 'boolean', defaultValue: true },
            ],
        },
        changelog: [
            {
                version: '1.3.0',
                date: new Date('2024-10-30'),
                changes: ['Added sound customization', 'Improved delivery rate'],
            },
        ],
        createdAt: new Date('2024-06-01'),
        updatedAt: new Date('2024-10-30'),
    },
];

async function seedPlugins() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected successfully');

        const db = mongoose.connection.db;
        const collection = db.collection('plugins');

        // Clear existing plugins
        console.log('Clearing existing plugins...');
        await collection.deleteMany({});

        // Insert sample plugins
        console.log('Inserting sample plugins...');
        await collection.insertMany(samplePlugins);

        console.log(`✅ Successfully seeded ${samplePlugins.length} plugins to marketplace`);
        console.log('\nPlugins:');
        samplePlugins.forEach((plugin) => {
            console.log(`  - ${plugin.name} (${plugin.pluginId})`);
        });

        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
    } catch (error) {
        console.error('Error seeding plugins:', error);
        process.exit(1);
    }
}

seedPlugins();
