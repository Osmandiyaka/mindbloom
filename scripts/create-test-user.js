#!/usr/bin/env node

/**
 * Script to create a test user for a tenant
 * Usage: node scripts/create-test-user.js
 */

const http = require('http');

// First, get the tenant ID for 'greenfield'
const getTenant = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/tenants/code/greenfield',
      method: 'GET',
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Failed to get tenant: ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
};

// Create user
const createUser = (tenantId) => {
  return new Promise((resolve, reject) => {
    const userData = JSON.stringify({
      email: "admin@greenfield.edu",
      password: "admin123",
      name: "Admin User",
      role: "admin",
      tenantId: tenantId
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': userData.length
      }
    };

    console.log('Creating test user...');
    console.log('User Data:', JSON.parse(userData));
    console.log('');

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('✅ Response Status:', res.statusCode);
        
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 201) {
            console.log('✅ User Created Successfully!');
            console.log('\nUser Details:');
            console.log('  ID:', response.id);
            console.log('  Name:', response.name);
            console.log('  Email:', response.email);
            console.log('  Role:', response.role);
            console.log('\n📝 Login Credentials:');
            console.log('  School Code: greenfield');
            console.log('  Email: admin@greenfield.edu');
            console.log('  Password: admin123');
          } else {
            console.log('❌ Failed to create user');
            console.log('Response:', response);
          }
        } catch (e) {
          console.log('Response:', data);
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error creating user:', error.message);
      console.log('\n⚠️  Make sure the backend is running on http://localhost:3000');
      reject(error);
    });

    req.write(userData);
    req.end();
  });
};

// Main execution
(async () => {
  try {
    console.log('🔍 Fetching tenant information...\n');
    const tenant = await getTenant();
    console.log('✅ Found tenant:', tenant.name);
    console.log('   Tenant ID:', tenant.id);
    console.log('');
    
    await createUser(tenant.id);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
