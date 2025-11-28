import { Schema, Types } from 'mongoose';

export const BedSchema = new Schema(
  {
    hostelId: { type: Types.ObjectId, ref: 'Hostel', required: true },
    roomId: { type: Types.ObjectId, ref: 'HostelRoom', required: true },
    label: { type: String, required: true },
    status: { type: String, enum: ['available', 'occupied', 'maintenance'], default: 'available' },
  },
  { timestamps: true },
);

BedSchema.index({ roomId: 1, label: 1 }, { unique: true });
