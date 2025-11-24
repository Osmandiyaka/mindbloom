const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mindbloom';

async function testPluginRepository() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected successfully\n');

        const collection = mongoose.connection.collection('plugins');

        // Get all plugins
        const plugins = await collection.find({}).toArray();

        console.log(`Total plugins in database: ${plugins.length}\n`);

        plugins.forEach(plugin => {
            console.log(`Plugin: ${plugin.name}`);
            console.log(`  ID: ${plugin._id}`);
            console.log(`  PluginID: ${plugin.pluginId}`);
            console.log(`  Category: ${plugin.category}`);
            console.log(`  Status: ${plugin.status}`);
            console.log(`  Has manifest: ${!!plugin.manifest}`);
            console.log(`  Has createdAt: ${!!plugin.createdAt}`);
            console.log(`  Has updatedAt: ${!!plugin.updatedAt}`);
            console.log('---');
        });

        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

testPluginRepository();
