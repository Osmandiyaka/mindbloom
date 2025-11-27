import { Schema, Types } from 'mongoose';

export const AllocationSchema = new Schema(
  {
    studentId: { type: Types.ObjectId, ref: 'Student', required: true },
    hostelId: { type: Types.ObjectId, ref: 'Hostel', required: true },
    roomId: { type: Types.ObjectId, ref: 'HostelRoom', required: true },
    bedId: { type: Types.ObjectId, ref: 'HostelBed', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
    notes: { type: String },
  },
  { timestamps: true },
);

AllocationSchema.index({ studentId: 1, status: 1 });
