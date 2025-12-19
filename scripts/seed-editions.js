const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mindbloom';

const EditionSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, trim: true },
    displayName: { type: String, required: true, trim: true },
    description: { type: String },
    isActive: { type: Boolean, required: true, default: true },
    sortOrder: { type: Number, required: true, default: 0, min: 0 },
    isFallback: { type: Boolean, required: true, default: false },
}, { timestamps: true, collection: 'editions' });
EditionSchema.index({ name: 1 }, { unique: true });
EditionSchema.index({ isFallback: 1 }, { unique: true, partialFilterExpression: { isFallback: true } });

async function seed() {
    await mongoose.connect(MONGODB_URI);

    const Edition = mongoose.model('Edition', EditionSchema);

    const editions = [
        { name: 'trial', displayName: 'Trial', sortOrder: 0, isActive: true, isFallback: true },
        { name: 'basic', displayName: 'Basic', sortOrder: 10, isActive: true },
        { name: 'premium', displayName: 'Premium', sortOrder: 20, isActive: true },
    ];

    for (const ed of editions) {
        await Edition.updateOne({ name: ed.name }, { $set: ed }, { upsert: true });
    }

    const fallbackCount = await Edition.countDocuments({ isFallback: true });
    if (fallbackCount > 1) {
        // Ensure only one fallback; keep the lowest sortOrder as fallback
        const fallbackEdition = await Edition.findOne({}).sort({ isFallback: -1, sortOrder: 1, createdAt: 1 });
        await Edition.updateMany({ _id: { $ne: fallbackEdition._id } }, { $set: { isFallback: false } });
    }

    console.log('Editions seeded.');
    await mongoose.disconnect();
}

seed().catch((err) => {
    console.error('Error seeding editions:', err);
    process.exit(1);
});
