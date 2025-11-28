import { Schema, Types } from 'mongoose';

export const StaffSchema = new Schema(
    {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        middleName: { type: String },
        fullName: { type: String },
        email: { type: String, unique: true },
        phone: { type: String },
        gender: { type: String, enum: ['male', 'female', 'other'] },
        dateOfBirth: { type: Date },
        address: {
            street: String,
            city: String,
            state: String,
            postalCode: String,
            country: String,
        },
        emergencyContacts: [
            {
                name: String,
                relationship: String,
                phone: String,
                email: String,
            },
        ],
        departmentCode: { type: String, ref: 'Department' },
        designationCode: { type: String, ref: 'Designation' },
        subjects: [{ type: String }],
        employeeId: { type: String, unique: true },
        joinDate: { type: Date },
        status: { type: String, enum: ['active', 'inactive', 'terminated'], default: 'active' },
        contractType: { type: String, enum: ['full-time', 'part-time', 'contract'], default: 'full-time' },
        salary: {
            amount: Number,
            currency: { type: String, default: 'USD' },
            frequency: { type: String, enum: ['monthly', 'hourly', 'annual'], default: 'monthly' },
        },
        bank: {
            accountName: String,
            accountNumber: String,
            bankName: String,
            branch: String,
            ifsc: String,
        },
        documents: [
            {
                name: String,
                url: String,
                type: String,
                uploadedAt: Date,
            },
        ],
        metadata: Schema.Types.Mixed,
    },
    { timestamps: true },
);

StaffSchema.index({ employeeId: 1 }, { unique: true, sparse: true });
StaffSchema.index({ email: 1 }, { unique: true, sparse: true });
