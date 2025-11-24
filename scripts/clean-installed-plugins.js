#!/usr/bin/env node

/**
 * Clean up installed plugins with invalid UUID _id fields
 * This script removes all installed plugins that have UUID strings as _ids
 * instead of MongoDB ObjectIds
 */

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mindbloom';

async function cleanInstalledPlugins() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const db = mongoose.connection.db;
        const collection = db.collection('installed_plugins');

        // Find all installed plugins
        const allPlugins = await collection.find({}).toArray();
        console.log(`📊 Found ${allPlugins.length} installed plugins`);

        let removedCount = 0;

        // Check each plugin's _id
        for (const plugin of allPlugins) {
            const idString = plugin._id.toString();

            // Check if it's a UUID (contains hyphens in UUID pattern)
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idString);

            if (isUUID) {
                console.log(`🗑️  Removing plugin with UUID _id: ${idString} (${plugin.pluginId})`);
                await collection.deleteOne({ _id: plugin._id });
                removedCount++;
            }
        }

        console.log(`\n✅ Cleanup complete!`);
        console.log(`   - Total plugins: ${allPlugins.length}`);
        console.log(`   - Removed (UUID): ${removedCount}`);
        console.log(`   - Remaining: ${allPlugins.length - removedCount}`);

        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error cleaning installed plugins:', error);
        process.exit(1);
    }
}

cleanInstalledPlugins();
