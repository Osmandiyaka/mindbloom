#!/usr/bin/env node

/**
 * Seed script to create 3 host tenants and 3 users each
 * Usage: node scripts/seed-host-tenants.js
 */

const http = require('http');

const BASE = { hostname: 'localhost', port: 3000 };

const tenantsToCreate = [
    {
        name: 'Greenfield Free School',
        subdomain: 'greenfield-free',
        edition: 'free',
        contactEmail: 'admin@greenfield-free.test',
        limits: {
            maxStudents: 100,
            maxTeachers: 10,
            maxClasses: 8,
            maxAdmins: 3,
            maxStorage: 2000, // MB
            maxBandwidth: 50, // GB/month
        }
    },
    {
        name: 'Riverdale Academy',
        subdomain: 'riverdale',
        edition: 'premium',
        contactEmail: 'admin@riverdale.test',
        limits: {
            maxStudents: 2000,
            maxTeachers: 200,
            maxClasses: 80,
            maxAdmins: 10,
            maxStorage: 50000,
            maxBandwidth: 1000,
        }
    },
    {
        name: 'Summit Enterprise',
        subdomain: 'summit',
        edition: 'enterprise',
        contactEmail: 'admin@summit.test',
        limits: {
            maxStudents: 10000,
            maxTeachers: 500,
            maxClasses: 300,
            maxAdmins: 50,
            maxStorage: 200000,
            maxBandwidth: 5000,
        }
    },
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

const dryRun = process.argv.includes('--dry-run');

async function createTenant(tenant) {
    try {
        // Prefer editionId when available, else fall back to edition code
        const body = {
            name: tenant.name,
            subdomain: tenant.subdomain,
            contactEmail: tenant.contactEmail,
            adminName: tenant.adminName || 'Admin',
            adminEmail: tenant.adminEmail || `admin@${tenant.subdomain}.test`,
            adminPassword: tenant.adminPassword || 'admin123'
        };
        if (tenant.editionId) {
            body.editionId = tenant.editionId;
        } else if (tenant.edition) {
            body.edition = tenant.edition;
        }

        if (dryRun) {
            console.log('DRY RUN: POST /api/tenants', body);
            return { id: `dry-${tenant.subdomain}`, ...body };
        }

        const res = await request({ path: '/api/tenants', method: 'POST' }, body);

        if (res.status === 201 || res.status === 200) {
            return res.body;
        }

        // Handle common conflict where the admin email already exists; retry once with a unique admin email
        if (res.status === 409 && res.body && typeof res.body.message === 'string' && res.body.message.includes('User with this email already exists')) {
            const altEmail = `admin+${Date.now()}@${tenant.subdomain}.test`;
            console.warn(`Admin email conflict for ${tenant.subdomain}, retrying with ${altEmail}`);
            const retryBody = { ...body, adminEmail: altEmail };
            const retryRes = await request({ path: '/api/tenants', method: 'POST' }, retryBody);
            if (retryRes.status === 201 || retryRes.status === 200) return retryRes.body;
            console.error('Create tenant retry failed:', retryRes);
            throw new Error(`Failed to create tenant ${tenant.subdomain} after retry (${retryRes.status})`);
        }

        console.error('Create tenant failed (non-2xx):', res);
        throw new Error(`Failed to create tenant ${tenant.subdomain} (${res.status})`);
    } catch (err) {
        console.error('Create tenant request error:', err && (err.stack || err.message || JSON.stringify(err)));
        throw err;
    }
}

async function createUserForTenant(tenantId, user) {
    if (dryRun) {
        console.log(`DRY RUN: register user ${user.email} for tenant ${tenantId}`);
        return { id: `dry-${user.email}` };
    }
    const res = await request({ path: '/api/auth/register', method: 'POST' }, Object.assign({ tenantId }, user));
    if (res.status === 201) return res.body;
    if (res.status === 409) {
        return { message: 'already exists', existing: res.body };
    }
    throw new Error(`Failed to create user ${user.email} (${res.status}) - ${JSON.stringify(res.body)}`);
}

const mongoose = require('mongoose');
const { Types } = require('mongoose');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mindbloom';

async function main() {
    console.log('Seeding host tenants...');

    // connect to Mongo so we can set editionId directly after creating tenants
    await mongoose.connect(MONGODB_URI);
    const TenantModel = mongoose.model('Tenant', new mongoose.Schema({}, { strict: false, collection: 'tenants' }));

    const canonical = new Set(['free', 'professional', 'premium', 'enterprise']);

    // simple alias map for legacy names
    const aliasMap = {
        trial: 'free',
        starter: 'free',
        basic: 'professional',
    };

    for (const t of tenantsToCreate) {
        try {
            // resolve canonical edition name and find corresponding edition record
            const requested = (t.edition || 'free').toLowerCase();
            const resolvedName = aliasMap[requested] || requested;
            const resolved = canonical.has(resolvedName) ? resolvedName : 'free';
            console.log(`- Resolved edition '${t.edition || 'free'}' -> '${resolved}'`);

            let tenant = await findTenantByCode(t.subdomain);
            if (tenant) {
                console.log(`- Tenant ${t.subdomain} exists (id=${tenant.id}), reusing`);
            } else {
                console.log(`- Creating tenant ${t.subdomain}...`);
                const createPayload = { ...t };
                createPayload.editionId = resolved;
                tenant = await createTenant(createPayload);
                console.log(`  created id=${tenant.id}`);
            }

            // Ensure tenant has canonical edition id
            if (tenant && tenant.id) {
                try {
                    if (dryRun) {
                        console.log(`DRY RUN: would update tenant ${t.subdomain} (${tenant.id}) with editionId=${resolved}`);
                    } else {
                        const tenantObjectId = new Types.ObjectId(tenant.id);
                        await TenantModel.updateOne(
                            { _id: tenantObjectId },
                            { $set: { editionId: resolved } }
                        ).exec();
                        console.log(`  - tenant ${t.subdomain} updated with editionId=${resolved}`);
                    }
                } catch (err) {
                    console.warn(`  - failed to set editionId for tenant ${t.subdomain}:`, err.message || (err.stack || err));
                }
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
            console.error(`Failed for tenant ${t.subdomain}:`, err && (err.stack || err.message || JSON.stringify(err)));
        }
    }

    console.log('Done.');
    await mongoose.disconnect();
}

main().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
