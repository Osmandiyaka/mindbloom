import { Schema, Types } from 'mongoose';

export const RoomSchema = new Schema(
  {
    hostelId: { type: Types.ObjectId, ref: 'Hostel', required: true },
    name: { type: String, required: true },
    floor: { type: String },
    type: { type: String, enum: ['single', 'double', 'triple', 'dorm'], default: 'dorm' },
    capacity: { type: Number, default: 1 },
    gender: { type: String, enum: ['male', 'female', 'mixed'], default: 'mixed' },
    status: { type: String, enum: ['available', 'full', 'maintenance'], default: 'available' },
  },
  { timestamps: true },
);

RoomSchema.index({ hostelId: 1, name: 1 }, { unique: true });
