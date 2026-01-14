const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mindbloom';

const EditionSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, trim: true },
    displayName: { type: String, required: true, trim: true },
    description: { type: String },
    monthlyPrice: { type: Number },
    annualPrice: { type: Number },
    perStudentMonthly: { type: Number },
    annualPriceNotes: { type: String },
    modules: { type: [String], default: [] },
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
        {
            name: 'free',
            displayName: 'Free',
            description: 'Basic features for small schools and evaluation',
            monthlyPrice: 0,
            annualPrice: 0,
            perStudentMonthly: null,
            annualPriceNotes: null,
            modules: ['dashboard', 'students', 'attendance', 'academics', 'setup'],
            sortOrder: 10,
            isActive: true,
            isFallback: true,
        },
        {
            name: 'professional',
            displayName: 'Professional',
            description: 'Most features for small to medium schools',
            monthlyPrice: 99,
            annualPrice: 950,
            perStudentMonthly: null,
            annualPriceNotes: null,
            modules: ['dashboard', 'students', 'admissions', 'attendance', 'academics', 'fees', 'library', 'roles', 'tasks', 'setup', 'plugins'],
            sortOrder: 20,
            isActive: true,
        },
        {
            name: 'premium',
            displayName: 'Premium',
            description: 'Advanced features for multi-school operations',
            monthlyPrice: 299,
            annualPrice: 2870,
            perStudentMonthly: null,
            annualPriceNotes: null,
            modules: ['dashboard', 'students', 'admissions', 'attendance', 'academics', 'fees', 'accounting', 'finance', 'hr', 'library', 'hostel', 'transport', 'roles', 'tasks', 'setup', 'plugins'],
            sortOrder: 30,
            isActive: true,
        },
        {
            name: 'enterprise',
            displayName: 'Enterprise',
            description: 'Enterprise-grade features and support',
            monthlyPrice: null,
            perStudentMonthly: 2,
            annualPrice: null,
            annualPriceNotes: 'Custom',
            modules: ['dashboard', 'students', 'admissions', 'apply', 'attendance', 'academics', 'fees', 'accounting', 'finance', 'hr', 'payroll', 'library', 'hostel', 'transport', 'roles', 'tasks', 'setup', 'plugins'],
            sortOrder: 40,
            isActive: true,
        },
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
