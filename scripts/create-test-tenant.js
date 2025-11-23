#!/usr/bin/env node

/**
 * Script to create a test tenant in the database
 * Usage: node scripts/create-test-tenant.js
 */

const http = require('http');

const tenantData = JSON.stringify({
    name: "Greenfield High School",
    subdomain: "greenfield",
    plan: "premium"
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/tenants',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': tenantData.length
    }
};

console.log('Creating test tenant...');
console.log('Tenant Data:', JSON.parse(tenantData));

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('\n✅ Response Status:', res.statusCode);
        try {
            const response = JSON.parse(data);
            console.log('✅ Tenant Created Successfully!');
            console.log('\nTenant Details:');
            console.log('  ID:', response.id);
            console.log('  Name:', response.name);
            console.log('  Code:', response.subdomain);
            console.log('  Plan:', response.plan);
            console.log('  Status:', response.status);
            console.log('\n📝 You can now use this code to login: "greenfield"');
        } catch (e) {
            console.log('Response:', data);
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Error creating tenant:', error.message);
    console.log('\n⚠️  Make sure the backend is running on http://localhost:3000');
});

req.write(tenantData);
req.end();
