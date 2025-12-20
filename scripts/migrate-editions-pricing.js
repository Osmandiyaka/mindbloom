const mongoose = require('mongoose');
const { createGlobalEditions } = require('../backend/src/domain/edition/entities/system-editions');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mindbloom';

const EditionSchema = new mongoose.Schema({ name: String }, { strict: false, collection: 'editions' });
const Edition = mongoose.model('Edition', EditionSchema);

async function migrate() {
    await mongoose.connect(MONGODB_URI);

    const desired = createGlobalEditions();

    for (const d of desired) {
        const update = {
            $set: {
                monthlyPrice: d.monthlyPrice ?? null,
                annualPrice: d.annualPrice ?? null,
                perStudentMonthly: d.perStudentMonthly ?? null,
                annualPriceNotes: d.annualPriceNotes ?? null,
            },
        };

        await Edition.updateOne({ name: d.name }, update).exec();
        console.log('Updated pricing for edition', d.name);
    }

    await mongoose.disconnect();
}

migrate().catch(err => {
    console.error('Migration failed', err);
    process.exit(1);
});