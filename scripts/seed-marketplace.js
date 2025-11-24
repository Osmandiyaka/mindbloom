const mongoose = require('mongoose');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mindbloom';

const PluginSchema = new mongoose.Schema({
    pluginId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    version: { type: String, required: true },
    description: { type: String, required: true },
    author: { type: String, required: true },
    category: { type: String, required: true },
    status: { type: String, default: 'available' },
    isOfficial: { type: Boolean, default: false },
    iconUrl: { type: String, required: true },
    bannerUrl: { type: String, default: '' },
    screenshots: [{ type: String }],
    price: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    manifest: { type: mongoose.Schema.Types.Mixed, required: true },
    settings: { type: mongoose.Schema.Types.Mixed, default: {} },
    tags: [{ type: String }],
    changelog: [{
        version: String,
        date: Date,
        changes: [String]
    }],
}, { timestamps: true, collection: 'plugins' });

const samplePlugins = [
    {
        pluginId: 'sms-notifications',
        name: 'SMS Notifications',
        version: '1.0.0',
        description: 'Send SMS notifications to students and parents for important updates, fee reminders, and attendance alerts',
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
        ratingCount: 45,
        manifest: {
            permissions: ['SEND_SMS', 'READ_STUDENTS'],
            provides: {
                routes: [],
                menuItems: [],
                settings: [
                    { key: 'apiKey', label: 'SMS Gateway API Key', type: 'password', required: true },
                    { key: 'senderId', label: 'Sender ID', type: 'text', required: true }
                ]
            }
        },
        tags: ['communication', 'notifications', 'sms'],
        changelog: [
            {
                version: '1.0.0',
                date: new Date(),
                changes: ['Initial release', 'SMS gateway integration', 'Automated notifications']
            }
        ]
    },
    {
        pluginId: 'report-generator',
        name: 'Advanced Report Generator',
        version: '2.1.0',
        description: 'Generate comprehensive reports including academic performance, attendance, fee collection, and custom analytics',
        author: 'MindBloom Team',
        category: 'reporting',
        status: 'available',
        isOfficial: true,
        iconUrl: '📊',
        bannerUrl: '',
        screenshots: [],
        price: 0,
        downloads: 890,
        rating: 4.9,
        ratingCount: 62,
        manifest: {
            permissions: ['READ_STUDENTS', 'READ_FEES', 'WRITE_REPORTS'],
            provides: {
                routes: [],
                menuItems: [],
                settings: [
                    { key: 'defaultFormat', label: 'Default Report Format', type: 'select', options: [{ label: 'PDF', value: 'pdf' }, { label: 'Excel', value: 'xlsx' }], defaultValue: 'pdf' }
                ]
            }
        },
        tags: ['reporting', 'analytics', 'pdf', 'excel'],
        changelog: [
            {
                version: '2.1.0',
                date: new Date(),
                changes: ['Added Excel export', 'Performance improvements', 'Custom templates support']
            }
        ]
    },
    {
        pluginId: 'payment-gateway-stripe',
        name: 'Stripe Payment Gateway',
        version: '1.5.2',
        description: 'Accept online fee payments via Stripe. Supports credit cards, debit cards, and digital wallets',
        author: 'MindBloom Community',
        category: 'payment',
        status: 'available',
        isOfficial: false,
        iconUrl: '💳',
        bannerUrl: '',
        screenshots: [],
        price: 49,
        downloads: 456,
        rating: 4.7,
        ratingCount: 28,
        manifest: {
            permissions: ['PROCESS_PAYMENTS', 'READ_FEES', 'WRITE_FEES'],
            provides: {
                routes: [],
                menuItems: [],
                settings: [
                    { key: 'stripeSecretKey', label: 'Stripe Secret Key', type: 'password', required: true },
                    { key: 'stripePublicKey', label: 'Stripe Publishable Key', type: 'text', required: true }
                ]
            }
        },
        tags: ['payment', 'stripe', 'online-payment', 'fees'],
        changelog: []
    },
    {
        pluginId: 'attendance-biometric',
        name: 'Biometric Attendance',
        version: '3.0.0',
        description: 'Integrate biometric devices for automated attendance tracking with real-time synchronization',
        author: 'TechEdu Solutions',
        category: 'attendance',
        status: 'available',
        isOfficial: false,
        iconUrl: '👆',
        bannerUrl: '',
        screenshots: [],
        price: 99,
        downloads: 234,
        rating: 4.5,
        ratingCount: 19,
        manifest: {
            permissions: ['WRITE_ATTENDANCE', 'READ_STUDENTS'],
            provides: {
                routes: [],
                menuItems: [],
                settings: [
                    { key: 'deviceType', label: 'Biometric Device Type', type: 'select', required: true },
                    { key: 'deviceIp', label: 'Device IP Address', type: 'text', required: true }
                ]
            }
        },
        tags: ['attendance', 'biometric', 'automation', 'hardware'],
        changelog: []
    },
    {
        pluginId: 'parent-portal',
        name: 'Parent Portal',
        version: '1.2.0',
        description: 'Dedicated parent portal for viewing student progress, attendance, fees, and communicating with teachers',
        author: 'MindBloom Team',
        category: 'communication',
        status: 'available',
        isOfficial: true,
        iconUrl: '👨‍👩‍👧',
        bannerUrl: '',
        screenshots: [],
        price: 0,
        downloads: 1567,
        rating: 4.9,
        ratingCount: 89,
        manifest: {
            permissions: ['READ_STUDENTS', 'SEND_NOTIFICATIONS'],
            provides: {
                routes: [],
                menuItems: [],
                settings: []
            }
        },
        tags: ['parent', 'portal', 'communication', 'engagement'],
        changelog: []
    },
    {
        pluginId: 'library-management',
        name: 'Library Management System',
        version: '2.0.1',
        description: 'Comprehensive library management with book cataloging, issue/return tracking, and fine management',
        author: 'EduSoft',
        category: 'library',
        status: 'available',
        isOfficial: false,
        iconUrl: '📚',
        bannerUrl: '',
        screenshots: [],
        price: 39,
        downloads: 678,
        rating: 4.6,
        ratingCount: 34,
        manifest: {
            permissions: ['MANAGE_LIBRARY'],
            provides: {
                routes: [],
                menuItems: [],
                settings: []
            }
        },
        tags: ['library', 'books', 'management'],
        changelog: []
    },
    {
        pluginId: 'transport-tracking',
        name: 'GPS Transport Tracking',
        version: '1.8.0',
        description: 'Real-time GPS tracking of school buses with route optimization and parent notifications',
        author: 'SafeRoute Inc',
        category: 'transport',
        status: 'available',
        isOfficial: false,
        iconUrl: '🚌',
        bannerUrl: '',
        screenshots: [],
        price: 149,
        downloads: 189,
        rating: 4.8,
        ratingCount: 15,
        manifest: {
            permissions: ['MANAGE_TRANSPORT', 'SEND_NOTIFICATIONS'],
            provides: {
                routes: [],
                menuItems: [],
                settings: []
            }
        },
        tags: ['transport', 'gps', 'tracking', 'safety'],
        changelog: []
    },
    {
        pluginId: 'analytics-dashboard',
        name: 'Advanced Analytics Dashboard',
        version: '1.0.0',
        description: 'Powerful analytics and visualization dashboard with customizable widgets and insights',
        author: 'DataViz Pro',
        category: 'analytics',
        status: 'available',
        isOfficial: false,
        iconUrl: '📈',
        bannerUrl: '',
        screenshots: [],
        price: 79,
        downloads: 345,
        rating: 4.7,
        ratingCount: 22,
        manifest: {
            permissions: ['READ_STUDENTS', 'READ_FEES', 'ACCESS_AUDIT_LOGS'],
            provides: {
                routes: [],
                menuItems: [],
                settings: []
            }
        },
        tags: ['analytics', 'dashboard', 'visualization', 'insights'],
        changelog: []
    }
];

async function seedPlugins() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const Plugin = mongoose.model('Plugin', PluginSchema);

        // Clear existing plugins
        await Plugin.deleteMany({});
        console.log('Cleared existing plugins');

        // Insert sample plugins
        const result = await Plugin.insertMany(samplePlugins);
        console.log(`✅ Successfully seeded ${result.length} plugins:`);
        result.forEach(plugin => {
            console.log(`  - ${plugin.name} (${plugin.pluginId})`);
        });

        await mongoose.connection.close();
        console.log('\n🎉 Marketplace seeding complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding plugins:', error);
        process.exit(1);
    }
}

seedPlugins();
