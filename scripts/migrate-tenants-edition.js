const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mindbloom';

const TenantSchema = new mongoose.Schema({}, { strict: false, collection: 'tenants' });
const CANONICAL = new Set(['free', 'professional', 'premium', 'enterprise']);

async function migrate() {
    await mongoose.connect(MONGODB_URI);
    const Tenant = mongoose.model('Tenant', TenantSchema);
    const cursor = Tenant.find({ $or: [{ editionId: { $exists: false } }, { editionId: null }, { editionId: '' }] }).cursor();

    let updated = 0;
    let processed = 0;

    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
        processed += 1;
        const existing = String(doc.editionId || doc.edition || doc.metadata?.editionCode || '').toLowerCase();
        let editionToSet = CANONICAL.has(existing) ? existing : 'free';

        const update = { editionId: editionToSet };

        await Tenant.updateOne({ _id: doc._id }, { $set: update });
        updated += 1;
        if (updated % 50 === 0) console.log(`Updated ${updated} tenants...`);
    }

    console.log(`Migration complete. Processed ${processed} tenants, updated ${updated}.`);
    await mongoose.disconnect();
}

migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
