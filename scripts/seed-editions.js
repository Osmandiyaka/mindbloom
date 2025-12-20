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
        {
            name: 'starter',
            displayName: 'Starter',
            description: 'Core modules (students, attendance, grades), basic reports, email support, custom branding',
            monthlyPrice: 29,
            annualPrice: 278, // $23/mo effective
            maxStudents: 100,
            features: ['students', 'attendance', 'grades', 'reports', 'email_support', 'branding'],
            sortOrder: 10,
            isActive: true,
            isFallback: true,
        },
        {
            name: 'professional',
            displayName: 'Professional',
            description: 'Timetabling, parent portal, library/hostel mgmt, SMS notifications, priority support, API access',
            monthlyPrice: 99,
            annualPrice: 950, // $79/mo effective
            maxStudents: 500,
            features: ['timetabling', 'parent_portal', 'library', 'hostel', 'sms', 'priority_support', 'api_access'],
            sortOrder: 20,
            isActive: true,
        },
        {
            name: 'premium',
            displayName: 'Premium',
            description: 'Transport, exams, payroll, advanced analytics, custom workflows, phone support, custom domains',
            monthlyPrice: 299,
            annualPrice: 2870, // $239/mo effective
            maxStudents: 2000,
            features: ['transport', 'exams', 'payroll', 'analytics', 'workflows', 'phone_support', 'custom_domains'],
            sortOrder: 30,
            isActive: true,
        },
        {
            name: 'enterprise',
            displayName: 'Enterprise',
            description: 'Dedicated DB/support, SSO/SAML, custom modules, on-prem option, 24/7 support, white-label',
            monthlyPrice: 599,
            perStudentMonthly: 2,
            annualPrice: null,
            annualPriceNotes: 'Custom',
            maxStudents: null, // unlimited
            features: ['dedicated_db', 'sso', 'custom_modules', 'on_prem', '24_7_support', 'white_label'],
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
