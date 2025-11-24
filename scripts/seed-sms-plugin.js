const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mindbloom';

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
    tags: [{ type: String }],
    changelog: [{
        version: String,
        date: Date,
        changes: [String]
    }],
}, { timestamps: true, collection: 'plugins' });

const smsPlugin = {
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
        name: 'Twilio SMS Gateway',
        version: '1.0.0',
        description: 'Send SMS notifications to students and parents using Twilio',
        author: 'MindBloom Team',
        permissions: ['communications:sms:send', 'students:read'],
        provides: {
            routes: [
                { path: '/plugins/sms/send', method: 'POST', handler: 'sendSMS', permissions: ['communications:sms:send'] },
                { path: '/plugins/sms/send-bulk', method: 'POST', handler: 'sendBulkSMS', permissions: ['communications:sms:send'] },
                { path: '/plugins/sms/templates', method: 'GET', handler: 'getTemplates', permissions: ['settings:read'] },
                { path: '/plugins/sms/history', method: 'GET', handler: 'getHistory', permissions: ['settings:read'] },
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
            settings: [
                { key: 'accountSid', label: 'Twilio Account SID', type: 'text', required: true },
                { key: 'authToken', label: 'Twilio Auth Token', type: 'password', required: true },
                { key: 'fromNumber', label: 'From Phone Number', type: 'text', required: true },
                { key: 'enableFeeReminders', label: 'Enable Fee Reminders', type: 'boolean', defaultValue: true },
                { key: 'enableAttendanceAlerts', label: 'Enable Attendance Alerts', type: 'boolean', defaultValue: true },
            ],
        },
    },
    changelog: [
        {
            version: '1.0.0',
            date: new Date('2024-01-15'),
            changes: ['Initial release', 'Support for individual and bulk SMS', 'Message templates'],
        },
    ],
};

async function seedSMSPlugin() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected successfully');

        const Plugin = mongoose.model('Plugin', PluginSchema);

        // Clear existing SMS plugin
        console.log('Removing existing SMS plugin...');
        await Plugin.deleteMany({ pluginId: 'sms-twilio' });

        // Insert SMS plugin
        console.log('Inserting SMS plugin...');
        await Plugin.create(smsPlugin);

        console.log('✅ Successfully seeded SMS plugin to marketplace');
        console.log('\nPlugin:');
        console.log(`  - ${smsPlugin.name} (${smsPlugin.pluginId})`);

    } catch (error) {
        console.error('Error seeding SMS plugin:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
    }
}

seedSMSPlugin();
