const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mindbloom';

const TenantSchema = new mongoose.Schema({}, { strict: false, collection: 'tenants' });
const EditionSchema = new mongoose.Schema({ name: String }, { strict: false, collection: 'editions' });

async function migrate() {
    await mongoose.connect(MONGODB_URI);
    const Tenant = mongoose.model('Tenant', TenantSchema);
    const Edition = mongoose.model('Edition', EditionSchema);

    const editions = await Edition.find({}).lean();
    const editionNames = new Set(editions.map(e => e.name));
    const editionByName = new Map(editions.map(e => [e.name, e]));

    console.log('Found editions:', Array.from(editionNames));

    const cursor = Tenant.find({ $or: [{ edition: { $exists: false } }, { edition: null }, { edition: '' }] }).cursor();

    let updated = 0;
    let processed = 0;

    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
        processed += 1;
        const plan = doc.plan;
        let editionToSet = null;

        if (plan && typeof plan === 'string' && editionNames.has(plan)) {
            editionToSet = plan;
        } else if (plan && typeof plan === 'string') {
            // Try to normalize known aliases (e.g., premium -> premium)
            const normalized = plan.toLowerCase();
            if (editionNames.has(normalized)) editionToSet = normalized;
        }

        if (!editionToSet) {
            // default fallback
            editionToSet = 'trial';
        }

        const editionDoc = editionByName.get(editionToSet);

        const update = { edition: editionToSet };
        if (editionDoc && editionDoc._id) update.editionId = editionDoc._id;

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