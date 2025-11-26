import { Schema } from 'mongoose';

export const TaskCompletionSchema = new Schema(
    {
        taskId: { type: String, required: true },
        userId: { type: String, required: true },
        completionDate: { type: Date, default: Date.now },
        completionNotes: { type: String },
    },
    { timestamps: true },
);

TaskCompletionSchema.index({ taskId: 1, userId: 1 }, { unique: true });
