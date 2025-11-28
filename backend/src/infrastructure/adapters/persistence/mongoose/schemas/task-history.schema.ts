import { Schema } from 'mongoose';

export const TaskHistorySchema = new Schema(
    {
        taskId: { type: String, required: true },
        userId: { type: String, required: true },
        action: {
            type: String,
            enum: ['Created', 'Assigned', 'Started', 'Completed', 'Cancelled', 'Viewed', 'Updated', 'Deleted'],
            required: true,
        },
        actionDate: { type: Date, default: Date.now },
        details: { type: String },
    },
    { timestamps: true },
);

TaskHistorySchema.index({ taskId: 1, actionDate: -1 });
