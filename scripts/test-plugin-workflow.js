const mongoose = require('mongoose');
const axios = require('axios');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mindbloom';
const API_URL = 'http://localhost:3000/api';

// Test credentials - adjust based on your test user
const TEST_USER = {
    email: 'admin@mindbloom.com',
    password: 'admin123',
    subdomain: 'greenfield'
};

let authToken = '';
let tenantId = '';

async function login() {
    console.log('\n🔐 Step 1: Logging in...');
    try {
        const response = await axios.post(`${API_URL}/auth/login`, {
            email: TEST_USER.email,
            password: TEST_USER.password,
            subdomain: TEST_USER.subdomain
        });

        authToken = response.data.access_token;
        tenantId = response.data.user.tenantId;
        console.log('✅ Login successful');
        console.log(`   Token: ${authToken.substring(0, 20)}...`);
        console.log(`   Tenant ID: ${tenantId}`);
        return true;
    } catch (error) {
        console.error('❌ Login failed:', error.response?.data || error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', JSON.stringify(error.response.data, null, 2));
        }
        return false;
    }
}

async function checkMarketplace() {
    console.log('\n📦 Step 2: Checking marketplace...');
    try {
        const response = await axios.get(`${API_URL}/plugins/marketplace`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        console.log(`✅ Found ${response.data.length} plugins in marketplace:`);
        response.data.forEach(plugin => {
            console.log(`   - ${plugin.name} (${plugin.pluginId})`);
            console.log(`     Installed: ${plugin.isInstalled}`);
            console.log(`     Route: ${plugin.manifest?.provides?.menuItems?.[0]?.route || 'N/A'}`);
        });

        const libraryPlugin = response.data.find(p => p.pluginId === 'library-management');
        if (libraryPlugin) {
            console.log('\n📚 Library Plugin Details:');
            console.log(`   Name: ${libraryPlugin.name}`);
            console.log(`   Version: ${libraryPlugin.version}`);
            console.log(`   Is Installed: ${libraryPlugin.isInstalled}`);
            console.log(`   Menu Route: ${libraryPlugin.manifest?.provides?.menuItems?.[0]?.route}`);
        }

        return response.data;
    } catch (error) {
        console.error('❌ Failed to fetch marketplace:', error.response?.data || error.message);
        return [];
    }
}

async function installLibraryPlugin() {
    console.log('\n⚙️ Step 3: Installing library management plugin...');
    try {
        const response = await axios.post(`${API_URL}/plugins/install`,
            { pluginId: 'library-management' },
            { headers: { 'Authorization': `Bearer ${authToken}` } }
        );

        console.log('✅ Plugin installed successfully');
        console.log(`   Status: ${response.data.status}`);
        console.log(`   Version: ${response.data.version}`);
        console.log(`   Installed At: ${response.data.installedAt}`);
        return true;
    } catch (error) {
        const message = error.response?.data?.message || error.message;
        if (message.includes('already installed')) {
            console.log('ℹ️  Plugin already installed');
            return true;
        }
        console.error('❌ Failed to install plugin:', message);
        return false;
    }
}

async function enableLibraryPlugin() {
    console.log('\n🔌 Step 4: Enabling library management plugin...');
    try {
        const response = await axios.post(`${API_URL}/plugins/library-management/enable`,
            {},
            { headers: { 'Authorization': `Bearer ${authToken}` } }
        );

        console.log('✅ Plugin enabled successfully');
        console.log(`   Status: ${response.data.status}`);
        console.log(`   Enabled At: ${response.data.enabledAt}`);
        return true;
    } catch (error) {
        console.error('❌ Failed to enable plugin:', error.response?.data || error.message);
        return false;
    }
}

async function checkInstalledPlugins() {
    console.log('\n📋 Step 5: Checking installed plugins...');
    try {
        const response = await axios.get(`${API_URL}/plugins/installed`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        console.log(`✅ Found ${response.data.length} installed plugins:`);
        response.data.forEach(plugin => {
            console.log(`   - ${plugin.manifest?.name || plugin.pluginId}`);
            console.log(`     Status: ${plugin.status}`);
            console.log(`     Version: ${plugin.version}`);
            console.log(`     Menu Route: ${plugin.manifest?.provides?.menuItems?.[0]?.route || 'N/A'}`);
            console.log(`     Icon: ${plugin.manifest?.provides?.menuItems?.[0]?.icon || 'N/A'}`);
        });

        return response.data;
    } catch (error) {
        console.error('❌ Failed to fetch installed plugins:', error.response?.data || error.message);
        return [];
    }
}

async function checkDatabaseState() {
    console.log('\n🗄️ Step 6: Checking database state...');
    try {
        await mongoose.connect(MONGODB_URI);

        // Check plugins collection
        const PluginModel = mongoose.model('Plugin', new mongoose.Schema({}, { strict: false }), 'plugins');
        const marketplacePlugins = await PluginModel.find({});
        console.log(`   Marketplace plugins in DB: ${marketplacePlugins.length}`);

        // Check installed_plugins collection
        const InstalledPluginModel = mongoose.model('InstalledPlugin', new mongoose.Schema({}, { strict: false }), 'installed_plugins');
        const installedPlugins = await InstalledPluginModel.find({});
        console.log(`   Installed plugins in DB: ${installedPlugins.length}`);

        installedPlugins.forEach(plugin => {
            console.log(`     - ${plugin.pluginId} (${plugin.status}) for tenant ${plugin.tenantId}`);
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Failed to check database:', error.message);
    }
}

async function testPluginWorkflow() {
    console.log('🧪 Testing Complete Plugin Workflow');
    console.log('=====================================');

    // Login
    const loggedIn = await login();
    if (!loggedIn) {
        console.log('\n❌ Cannot proceed without authentication');
        return;
    }

    // Check marketplace
    const marketplacePlugins = await checkMarketplace();
    if (marketplacePlugins.length === 0) {
        console.log('\n⚠️  Marketplace is empty. Run: node scripts/seed-marketplace.js');
        return;
    }

    // Install plugin
    await installLibraryPlugin();

    // Enable plugin
    await enableLibraryPlugin();

    // Check installed plugins
    const installedPlugins = await checkInstalledPlugins();

    // Check database state
    await checkDatabaseState();

    // Final summary
    console.log('\n📊 Summary');
    console.log('=====================================');
    console.log(`✅ Marketplace plugins: ${marketplacePlugins.length}`);
    console.log(`✅ Installed plugins: ${installedPlugins.length}`);

    const libraryInstalled = installedPlugins.find(p => p.pluginId === 'library-management');
    if (libraryInstalled) {
        console.log('\n🎉 Library Plugin Successfully Installed!');
        console.log('=====================================');
        console.log(`Status: ${libraryInstalled.status}`);
        console.log(`Route: ${libraryInstalled.manifest?.provides?.menuItems?.[0]?.route}`);
        console.log('\n📝 Next Steps:');
        console.log('1. Open your frontend application');
        console.log('2. Navigate to "My Plugins" or the plugins launcher page');
        console.log('3. Click on "Library Management System"');
        console.log(`4. You should be redirected to: ${libraryInstalled.manifest?.provides?.menuItems?.[0]?.route}`);
    } else {
        console.log('\n❌ Library plugin not found in installed plugins');
    }

    process.exit(0);
}

// Run the test
testPluginWorkflow().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
