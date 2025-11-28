import { Schema, Types } from 'mongoose';

export const TaskSchema = new Schema(
    {
        title: { type: String, required: true, maxlength: 200 },
        description: { type: String },
        taskType: { type: String, enum: ['Manual', 'SystemGenerated'], default: 'Manual' },
        status: { type: String, enum: ['Pending', 'InProgress', 'Completed', 'Cancelled', 'Expired'], default: 'Pending' },
        priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
        assignmentType: { type: String, enum: ['User', 'Role', 'Broadcast'], default: 'User' },
        assignedToUserId: { type: String },
        assignedToRole: { type: String },
        createdBy: { type: String, required: true },
        dueDate: { type: Date },
        startedDate: { type: Date },
        completedDate: { type: Date },
        completedBy: { type: String },
        navigationRoute: { type: String, required: true },
        navigationParams: { type: Schema.Types.Mixed },
        category: { type: String },
        isDeleted: { type: Boolean, default: false },
        systemTaskKey: { type: String },
        recurrenceRule: { type: String },
        metadata: { type: Schema.Types.Mixed },
    },
    { timestamps: { createdAt: 'createdDate', updatedAt: 'updatedAt' } },
);

TaskSchema.index({ assignedToUserId: 1, status: 1 });
TaskSchema.index({ assignedToRole: 1, status: 1 });
TaskSchema.index({ createdDate: 1, status: 1 });
TaskSchema.index({ dueDate: 1, status: 1 });
TaskSchema.index({ systemTaskKey: 1 }, { unique: false, sparse: true });
TaskSchema.index({ category: 1, status: 1 });
