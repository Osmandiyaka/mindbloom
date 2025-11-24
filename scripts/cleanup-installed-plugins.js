const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mindbloom';

const InstalledPluginSchema = new mongoose.Schema({
    tenantId: { type: String, required: true },
    pluginId: { type: String, required: true },
    version: { type: String, required: true },
    status: { type: String, required: true },
    settings: { type: mongoose.Schema.Types.Mixed, default: {} },
    permissions: [{ type: String }],
    installedAt: { type: Date, default: Date.now },
    enabledAt: { type: Date },
    disabledAt: { type: Date },
    lastError: { type: String },
}, { timestamps: true, collection: 'installedplugins' });

async function cleanupInstalledPlugins() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected successfully');

        const InstalledPlugin = mongoose.model('InstalledPlugin', InstalledPluginSchema);

        // Remove all installed plugins
        console.log('Removing all installed plugins...');
        const result = await InstalledPlugin.deleteMany({});

        console.log(`✅ Successfully removed ${result.deletedCount} installed plugins`);
        console.log('\nMarketplace is now clean. You can install plugins fresh from the marketplace.');

    } catch (error) {
        console.error('Error cleaning up installed plugins:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
    }
}

cleanupInstalledPlugins();
