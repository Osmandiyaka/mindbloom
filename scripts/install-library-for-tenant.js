const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mindbloom';

async function installLibraryPlugin() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected successfully\n');

        const db = mongoose.connection.db;

        // Get the plugin from marketplace
        const plugin = await db.collection('plugins').findOne({ pluginId: 'library-barcode' });
        if (!plugin) {
            console.log('❌ Plugin not found in marketplace');
            await mongoose.disconnect();
            return;
        }

        // Get first tenant
        const tenant = await db.collection('tenants').findOne();
        if (!tenant) {
            console.log('❌ No tenant found');
            await mongoose.disconnect();
            return;
        }

        console.log('Installing for tenant:', tenant.name);

        // Check if already installed
        const existing = await db.collection('installedplugins').findOne({
            pluginId: plugin.pluginId,
            tenantId: tenant._id.toString()
        });

        if (existing) {
            console.log('\nℹ️  Plugin already installed');
            console.log('   Updating to ensure correct route...\n');

            // Update the existing installation to ensure correct manifest
            await db.collection('installedplugins').updateOne(
                { _id: existing._id },
                {
                    $set: {
                        manifest: plugin.manifest,
                        updatedAt: new Date()
                    }
                }
            );

            console.log('✅ Plugin updated successfully');
            console.log('   Route:', plugin.manifest.provides.menuItems[0].route);
            await mongoose.disconnect();
            return;
        }

        // Install plugin
        const installedPlugin = {
            _id: uuidv4(),
            pluginId: plugin.pluginId,
            tenantId: tenant._id.toString(),
            manifest: plugin.manifest,
            settings: plugin.manifest.provides.settings.reduce((acc, setting) => {
                acc[setting.key] = setting.defaultValue;
                return acc;
            }, {}),
            enabled: true,
            installedAt: new Date(),
            updatedAt: new Date()
        };

        await db.collection('installedplugins').insertOne(installedPlugin);

        console.log('\n✅ Successfully installed Library Management plugin');
        console.log('   Tenant:', tenant.name);
        console.log('   Plugin ID:', plugin.pluginId);
        console.log('   Route:', plugin.manifest.provides.menuItems[0].route);
        console.log('\n📝 You can now launch the plugin from your dashboard!');

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

installLibraryPlugin();
