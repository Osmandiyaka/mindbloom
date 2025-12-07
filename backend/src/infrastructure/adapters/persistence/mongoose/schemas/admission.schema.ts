import { Schema, Document, Types } from 'mongoose';

const AddressSchema = new Schema({
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
}, { _id: false });

const GuardianSchema = new Schema({
    id: String,
    name: { type: String, required: true },
    relationship: {
        type: String,
        enum: ['father', 'mother', 'guardian', 'other'],
        required: true,
    },
    phone: { type: String, required: true },
    email: String,
    occupation: String,
    address: AddressSchema,
    isPrimary: { type: Boolean, required: true },
}, { _id: false });

const PreviousSchoolSchema = new Schema({
    schoolName: String,
    grade: String,
    yearLeft: String,
    reasonForLeaving: String,
}, { _id: false });

const ApplicationDocumentSchema = new Schema({
    id: String,
    name: String,
    type: String,
    url: String,
    uploadedAt: Date,
}, { _id: false });

const StatusHistorySchema = new Schema({
    from: String,
    to: String,
    changedBy: String,
    changedAt: Date,
    note: String,
}, { _id: false });

const ApplicationScoreSchema = new Schema({
    academicScore: Number,
    interviewScore: Number,
    testScore: Number,
    totalScore: Number,
    scoredAt: Date,
    scoredBy: String,
}, { _id: false });

export const AdmissionSchema = new Schema(
    {
        tenantId: { type: Types.ObjectId, required: true, index: true },
        
        // Application Info
        applicationNumber: { type: String, unique: true, sparse: true },
        source: {
            type: String,
            enum: ['online', 'walk_in', 'referral', 'agent'],
            required: true,
        },
        status: {
            type: String,
            enum: [
                'inquiry',
                'submitted',
                'under_review',
                'accepted',
                'rejected',
                'waitlisted',
                'enrolled',
                'withdrawn',
            ],
            default: 'inquiry',
            index: true,
        },

        // Personal Information
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        middleName: String,
        dateOfBirth: { type: Date, required: true },
        gender: {
            type: String,
            enum: ['male', 'female', 'other'],
            required: true,
        },
        nationality: String,
        religion: String,
        bloodGroup: String,

        // Contact
        email: { type: String, required: true, lowercase: true, index: true },
        phone: { type: String, required: true },
        address: AddressSchema,

        // Guardians
        guardians: [GuardianSchema],

        // Academic
        gradeApplying: { type: String, required: true, index: true },
        academicYear: { type: String, required: true, index: true },
        previousSchool: PreviousSchoolSchema,

        // Application Materials
        documents: [ApplicationDocumentSchema],
        personalStatement: String,

        // Scoring
        score: ApplicationScoreSchema,

        // Status Management
        statusHistory: [StatusHistorySchema],
        statusUpdatedAt: Date,

        // Offer Management
        offerSentAt: Date,
        offerExpiresAt: Date,
        offerAcceptedAt: Date,

        // Waitlist
        waitlistPosition: Number,
        waitlistExpiresAt: Date,

        // Additional
        notes: String,
        internalNotes: String,
        applicationFeeAmount: Number,
        applicationFeePaid: { type: Boolean, default: false },

        // Submission
        submittedAt: Date,
    },
    { timestamps: true }
);

// Indexes for performance
AdmissionSchema.index({ tenantId: 1, status: 1 });
AdmissionSchema.index({ tenantId: 1, email: 1 });
AdmissionSchema.index({ tenantId: 1, applicationNumber: 1 });
AdmissionSchema.index({ tenantId: 1, gradeApplying: 1, academicYear: 1 });
AdmissionSchema.index({ tenantId: 1, createdAt: -1 });

export interface AdmissionDocument extends Document {
    _id: Types.ObjectId;
    tenantId: Types.ObjectId;
    applicationNumber?: string;
    source: string;
    status: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    dateOfBirth: Date;
    gender: string;
    nationality?: string;
    religion?: string;
    bloodGroup?: string;
    email: string;
    phone: string;
    address?: any;
    guardians: any[];
    gradeApplying: string;
    academicYear: string;
    previousSchool?: any;
    documents?: any[];
    personalStatement?: string;
    score?: any;
    statusHistory: any[];
    statusUpdatedAt: Date;
    offerSentAt?: Date;
    offerExpiresAt?: Date;
    offerAcceptedAt?: Date;
    waitlistPosition?: number;
    waitlistExpiresAt?: Date;
    notes?: string;
    internalNotes?: string;
    applicationFeeAmount?: number;
    applicationFeePaid?: boolean;
    submittedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

