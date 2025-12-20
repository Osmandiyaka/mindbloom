#!/usr/bin/env node

/**
 * Seed script to create 3 host tenants and 3 users each
 * Usage: node scripts/seed-host-tenants.js
 */

const http = require('http');

const BASE = { hostname: 'localhost', port: 3000 };

const tenantsToCreate = [
    { name: 'Greenfield Free School', subdomain: 'greenfield-free', edition: 'free', contactEmail: 'admin@greenfield-free.test' },
    { name: 'Riverdale Academy', subdomain: 'riverdale', edition: 'premium', contactEmail: 'admin@riverdale.test' },
    { name: 'Summit Enterprise', subdomain: 'summit', edition: 'enterprise', contactEmail: 'admin@summit.test' },
];

function request(options, body) {
    return new Promise((resolve, reject) => {
        const opts = Object.assign({}, BASE, options);
        const req = http.request(opts, (res) => {
            let data = '';
            res.on('data', (c) => (data += c));
            res.on('end', () => {
                const parsed = data ? tryParse(data) : null;
                resolve({ status: res.statusCode, body: parsed, raw: data });
            });
        });
        req.on('error', (err) => reject(err));
        if (body) {
            const s = JSON.stringify(body);
            req.setHeader('Content-Type', 'application/json');
            req.setHeader('Content-Length', Buffer.byteLength(s));
            req.write(s);
        }
        req.end();
    });
}

function tryParse(s) {
    try { return JSON.parse(s); } catch (e) { return s; }
}

async function findTenantByCode(code) {
    const res = await request({ path: `/api/tenants/code/${code}`, method: 'GET' });
    if (res.status === 200) return res.body;
    return null;
}

async function createTenant(tenant) {
    const res = await request({ path: '/api/tenants', method: 'POST' }, {
        name: tenant.name,
        subdomain: tenant.subdomain,
        edition: tenant.edition ?? tenant.plan,
        contactEmail: tenant.contactEmail,
        adminName: tenant.adminName || 'Admin',
        adminEmail: tenant.adminEmail || `admin@${tenant.subdomain}.test`,
        adminPassword: tenant.adminPassword || 'admin123'
    });

    if (res.status === 201 || res.status === 200) {
        return res.body;
    }
    console.error('Create tenant failed:', res);
    throw new Error(`Failed to create tenant ${tenant.subdomain} (${res.status})`);
}

async function createUserForTenant(tenantId, user) {
    const res = await request({ path: '/api/auth/register', method: 'POST' }, Object.assign({ tenantId }, user));
    if (res.status === 201) return res.body;
    if (res.status === 409) {
        return { message: 'already exists', existing: res.body };
    }
    throw new Error(`Failed to create user ${user.email} (${res.status}) - ${JSON.stringify(res.body)}`);
}

async function main() {
    console.log('Seeding host tenants...');

    for (const t of tenantsToCreate) {
        try {
            let tenant = await findTenantByCode(t.subdomain);
            if (tenant) {
                console.log(`- Tenant ${t.subdomain} exists (id=${tenant.id}), reusing`);
            } else {
                console.log(`- Creating tenant ${t.subdomain}...`);
                tenant = await createTenant(t);
                console.log(`  created id=${tenant.id}`);
            }

            // create 3 users for tenant
            const users = [
                { email: `admin@${t.subdomain}.test`, password: 'pass1234', name: `${t.name} Admin`, role: 'admin' },
                { email: `manager@${t.subdomain}.test`, password: 'pass1234', name: `${t.name} Manager`, role: 'manager' },
                { email: `user@${t.subdomain}.test`, password: 'pass1234', name: `${t.name} User`, role: 'user' },
            ];

            for (const u of users) {
                try {
                    const created = await createUserForTenant(tenant.id, u);
                    console.log(`  - user ${u.email}: ${created.id ? 'created id=' + created.id : JSON.stringify(created)}`);
                } catch (err) {
                    console.error(`  - failed to create ${u.email}: ${err.message}`);
                }
            }

        } catch (err) {
            console.error(`Failed for tenant ${t.subdomain}:`, err.message);
        }
    }

    console.log('Done.');
}

main().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
