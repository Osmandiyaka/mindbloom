import { Schema } from 'mongoose';

export const LeaveTypeSchema = new Schema(
    {
        name: { type: String, required: true },
        code: { type: String, required: true, unique: true },
        daysPerYear: { type: Number, default: 0 },
        carryForward: { type: Boolean, default: false },
        active: { type: Boolean, default: true },
    },
    { timestamps: true },
);
