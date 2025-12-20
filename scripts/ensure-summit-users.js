#!/usr/bin/env node

/**
 * Ensure summit-basic tenant has manager and user accounts
 * Usage: node scripts/ensure-summit-users.js
 */

const http = require('http');

const getTenant = () => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/tenants/code/summit-basic',
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
                    reject(new Error(`Failed to get tenant: ${res.statusCode} ${data}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
};

const createUser = (email, password, name, role, tenantId) => {
    return new Promise((resolve, reject) => {
        const userData = JSON.stringify({
            email,
            password,
            name,
            role,
            tenantId,
        });

        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/auth/register',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': userData.length,
            },
        };

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (res.statusCode === 201) {
                        console.log(`✅ Created user ${email}`);
                        resolve(response);
                    } else if (res.statusCode === 409) {
                        console.log(`ℹ️  User ${email} already exists`);
                        resolve(response);
                    } else {
                        console.error(`❌ Failed to create user ${email}:`, res.statusCode, response);
                        resolve(response);
                    }
                } catch (e) {
                    console.error('❌ Unexpected response:', data);
                    resolve();
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ Error creating user:', error.message);
            reject(error);
        });

        req.write(userData);
        req.end();
    });
};

(async () => {
    try {
        console.log('🔍 Looking up tenant summit-basic...');
        const tenant = await getTenant();
        console.log('✅ Found tenant:', tenant.name, 'id:', tenant.id || tenant._id);

        const tenantId = tenant.id || tenant._id;

        await createUser('manager@summit.edu', 'manager123', 'Manager User', 'manager', tenantId);
        await createUser('user@summit.edu', 'user123', 'Regular User', 'user', tenantId);

        console.log('\nDone.');
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
})();