import { Schema, Types } from 'mongoose';

export const LeaveRequestSchema = new Schema(
    {
        staffId: { type: Types.ObjectId, ref: 'Staff', required: true },
        leaveTypeCode: { type: String, ref: 'LeaveType', required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        days: { type: Number, required: true },
        reason: { type: String },
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
        approver: { type: String },
        decisionDate: { type: Date },
        comments: { type: String },
    },
    { timestamps: true },
);

LeaveRequestSchema.index({ staffId: 1, startDate: 1 });
