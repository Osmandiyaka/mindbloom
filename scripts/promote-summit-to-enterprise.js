#!/usr/bin/env node

const mongoose = require('mongoose');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mindbloom';

async function run() {
    await mongoose.connect(MONGODB_URI);
    const tenantSchema = new mongoose.Schema({}, { strict: false, collection: 'tenants' });
    const Tenant = mongoose.model('Tenant', tenantSchema);

    const tenant = await Tenant.findOne({ subdomain: 'summit-basic' });
    if (!tenant) {
        console.error('Tenant summit-basic not found.');
        await mongoose.disconnect();
        process.exit(1);
    }

    console.log('Found tenant:', tenant.subdomain, tenant._id.toString());

    const enterpriseLimits = {
        maxStudents: -1,
        maxTeachers: -1,
        maxClasses: -1,
        maxAdmins: -1,
        maxStorage: -1,
        maxBandwidth: -1,
    };

    tenant.plan = 'enterprise';
    tenant.limits = enterpriseLimits;
    await tenant.save();

    console.log('Updated tenant plan to enterprise and set enterprise limits.');

    await mongoose.disconnect();
}

run().catch(err => {
    console.error('Error promoting tenant:', err);
    process.exit(1);
});