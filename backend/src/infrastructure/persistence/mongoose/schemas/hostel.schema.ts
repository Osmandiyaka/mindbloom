import { Schema } from 'mongoose';

export const HostelSchema = new Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    managerName: { type: String },
    managerContact: { type: String },
    capacity: { type: Number, default: 0 },
    gender: { type: String, enum: ['male', 'female', 'mixed'], default: 'mixed' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

HostelSchema.index({ code: 1 }, { unique: true });
