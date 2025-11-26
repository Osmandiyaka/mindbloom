import { Schema, Types } from 'mongoose';

export const StaffAttendanceSchema = new Schema(
    {
        staffId: { type: Types.ObjectId, ref: 'Staff', required: true },
        date: { type: Date, required: true },
        status: { type: String, enum: ['present', 'absent', 'leave', 'half-day'], default: 'present' },
        checkIn: { type: Date },
        checkOut: { type: Date },
        notes: { type: String },
    },
    { timestamps: true },
);

StaffAttendanceSchema.index({ staffId: 1, date: 1 }, { unique: true });
