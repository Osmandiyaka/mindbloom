#!/usr/bin/env node

// Seed script to add sample AuditLog documents for a tenant
// Usage: node scripts/seed-audit-logs.js [tenantId]

const mongoose = require('mongoose');
const { randomBytes } = require('crypto');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mindbloom';
const tenantId = process.argv[2] || '69470782ff12df869a1077c5';

const AuditSchema = new mongoose.Schema(
    {
        id: { type: String, required: true },
        timestamp: { type: Date, required: true },
        correlationId: String,
        requestId: String,
        traceId: String,
        scope: { type: String, required: true },
        tenantId: String,
        tenantNameSnapshot: String,
        actorType: String,
        actorUserId: String,
        actorEmailSnapshot: String,
        actorRolesSnapshot: [String],
        isImpersonated: Boolean,
        impersonatorUserId: String,
        category: String,
        action: String,
        severity: String,
        result: String,
        message: String,
        tags: [String],
        targetType: String,
        targetId: String,
        targetNameSnapshot: String,
        before: mongoose.Schema.Types.Mixed,
        after: mongoose.Schema.Types.Mixed,
        diff: mongoose.Schema.Types.Mixed,
        changedFields: [String],
        ipAddress: String,
        userAgent: String,
        route: String,
        method: String,
        statusCode: Number,
        durationMs: Number,
        isSensitive: Boolean,
        redactionLevel: String,
        dataClassification: String,
    },
    { collection: 'audit_logs' }
);

const Audit = mongoose.model('AuditLog', AuditSchema, 'audit_logs');

async function seed() {
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to', MONGODB_URI);

    const now = Date.now();

    const templates = [
        {
            action: 'tenant.updated',
            category: 'TENANT',
            message: 'Tenant settings updated',
            actorEmail: 'admin@tenant.test',
            actorType: 'TENANT_USER',
        },
        {
            action: 'user.created',
            category: 'USER',
            message: 'New user account created',
            actorEmail: 'system@mindbloom',
            actorType: 'SYSTEM',
        },
        {
            action: 'user.login',
            category: 'AUTH',
            message: 'User logged in',
            actorEmail: 'teacher1@tenant.test',
            actorType: 'TENANT_USER',
        },
        {
            action: 'invoice.created',
            category: 'BILLING',
            message: 'Billing invoice generated',
            actorEmail: 'billing@tenant.test',
            actorType: 'TENANT_USER',
        },
        {
            action: 'issue.reported',
            category: 'ISSUE',
            message: 'Support issue reported by a user',
            actorEmail: 'parent1@tenant.test',
            actorType: 'TENANT_USER',
        },
        {
            action: 'permission.granted',
            category: 'RBAC',
            message: 'Permission granted to a role',
            actorEmail: 'admin@tenant.test',
            actorType: 'TENANT_USER',
        },
        {
            action: 'subscription.changed',
            category: 'BILLING',
            message: 'Subscription plan changed by host',
            actorEmail: 'host-admin@mindbloom',
            actorType: 'HOST_USER',
        },
        {
            action: 'plugin.installed',
            category: 'PLUGINS',
            message: 'Library plugin installed',
            actorEmail: 'admin@tenant.test',
            actorType: 'TENANT_USER',
        },
        {
            action: 'student.enrolled',
            category: 'ACADEMICS',
            message: 'Student enrolled in class',
            actorEmail: 'admissions@tenant.test',
            actorType: 'TENANT_USER',
        },
        {
            action: 'payment.refunded',
            category: 'PAYMENTS',
            message: 'Refund issued for invoice',
            actorEmail: 'billing@tenant.test',
            actorType: 'TENANT_USER',
        },
    ];

    const events = [];
    for (let i = 0; i < 15; i++) {
        const tpl = templates[i % templates.length];
        const ts = new Date(now - (i * 60 * 1000)); // each event a minute earlier
        const id = `${ts.getTime()}-${randomBytes(4).toString('hex')}`;

        const before = i % 3 === 0 ? { name: 'Old value ' + i } : null;
        const after = i % 3 === 0 ? { name: 'New value ' + i } : null;
        const diff = before && after ? { name: { from: before.name, to: after.name } } : null;

        events.push({
            id,
            timestamp: ts,
            scope: 'TENANT',
            tenantId,
            tenantNameSnapshot: 'Test Tenant',
            actorType: tpl.actorType,
            actorUserId: `u-${i}`,
            actorEmailSnapshot: tpl.actorEmail,
            actorRolesSnapshot: ['ADMIN'],
            category: tpl.category,
            action: tpl.action,
            severity: i % 7 === 0 ? 'CRITICAL' : (i % 5 === 0 ? 'WARN' : 'INFO'),
            result: i % 6 === 0 ? 'FAIL' : 'SUCCESS',
            message: `${tpl.message} (#${i + 1})`,
            tags: ['seed', 'testing'],
            targetType: tpl.action.startsWith('tenant') ? 'Tenant' : (tpl.action.startsWith('user') ? 'User' : 'Entity'),
            targetId: tpl.action.startsWith('tenant') ? tenantId : `t-${i}`,
            targetNameSnapshot: tpl.action.startsWith('tenant') ? 'Test Tenant' : undefined,
            before,
            after,
            diff,
            changedFields: diff ? ['name'] : [],
            ipAddress: `192.0.2.${i + 1}`,
            userAgent: 'Mozilla/5.0 (compatible; seed-script)',
            route: `/api/sample/${i}`,
            method: 'POST',
            statusCode: 200,
            durationMs: Math.floor(Math.random() * 500),
            isSensitive: false,
            redactionLevel: 'NONE',
            dataClassification: 'INTERNAL',
        });
    }

    try {
        await Audit.insertMany(events);
        const total = await Audit.countDocuments({ tenantId });
        console.log(`✅ Inserted ${events.length} audit events. Total for tenant ${tenantId}: ${total}`);
    } catch (err) {
        console.error('❌ Error inserting audit events:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
