import { Schema } from 'mongoose';

// Extended status stages for complete admission workflow
export enum AdmissionStatus {
    INQUIRY = 'inquiry',                    // Initial inquiry/interest
    APPLICATION = 'application',            // Application submitted
    UNDER_REVIEW = 'under_review',         // Being reviewed by admissions
    INTERVIEW_SCHEDULED = 'interview_scheduled', // Interview arranged
    DECISION_PENDING = 'decision_pending',  // Awaiting final decision
    ACCEPTED = 'accepted',                  // Offer made
    WAITLISTED = 'waitlisted',             // On waiting list
    REJECTED = 'rejected',                  // Application rejected
    ENROLLED = 'enrolled',                  // Student enrolled
    WITHDRAWN = 'withdrawn'                 // Applicant withdrew
}

export const AdmissionSchema = new Schema(
    {
        tenantId: { type: String, required: true, index: true },
        applicantName: { type: String, required: true },
        gradeApplying: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        dateOfBirth: { type: Date },
        previousSchool: { type: String },
        
        // Enhanced status with full workflow stages
        status: {
            type: String,
            enum: Object.values(AdmissionStatus),
            default: AdmissionStatus.INQUIRY,
            index: true,
        },
        
        // Status history for audit trail
        statusHistory: [{
            from: { type: String, enum: Object.values(AdmissionStatus) },
            to: { type: String, enum: Object.values(AdmissionStatus) },
            changedBy: String,
            changedAt: { type: Date, default: Date.now },
            note: String,
        }],
        
        // Application scoring and ranking
        score: {
            total: { type: Number, default: 0 },
            breakdown: {
                academicPerformance: Number,
                testScore: Number,
                interview: Number,
                extracurricular: Number,
                other: Number,
            },
            scoredBy: String,
            scoredAt: Date,
        },
        
        // Waitlist information
        waitlist: {
            position: Number,
            addedAt: Date,
            expiresAt: Date,
        },
        
        // Offer management
        offer: {
            sentAt: Date,
            expiresAt: Date,
            acceptedAt: Date,
            declinedAt: Date,
        },
        
        // Interview details
        interview: {
            scheduledAt: Date,
            completedAt: Date,
            interviewer: String,
            notes: String,
        },
        
        notes: { type: String },
        documents: [{ 
            name: String, 
            type: String, 
            url: String,
            uploadedAt: { type: Date, default: Date.now },
        }],
        statusUpdatedAt: { type: Date },
        
        // Reference to created student (once enrolled)
        studentId: { type: Schema.Types.ObjectId, ref: 'Student' },
    },
    { 
        timestamps: true,
        collection: 'admissions',
    }
);

// Indexes for efficient queries
AdmissionSchema.index({ tenantId: 1, status: 1 });
AdmissionSchema.index({ tenantId: 1, email: 1 });
AdmissionSchema.index({ tenantId: 1, gradeApplying: 1, status: 1 });
AdmissionSchema.index({ tenantId: 1, 'score.total': -1 }); // For ranking
AdmissionSchema.index({ tenantId: 1, 'offer.expiresAt': 1 }); // For expiration checks

