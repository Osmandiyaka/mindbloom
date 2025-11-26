export type TaskStatus = 'Pending' | 'InProgress' | 'Completed' | 'Cancelled' | 'Expired';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type AssignmentType = 'User' | 'Role' | 'Broadcast';

export interface TaskItem {
    id: string;
    title: string;
    description?: string;
    taskType: 'Manual' | 'SystemGenerated';
    status: TaskStatus;
    priority: TaskPriority;
    assignmentType: AssignmentType;
    assignedToUserId?: string;
    assignedToRole?: string;
    createdBy: string;
    createdDate: string;
    dueDate?: string;
    completedDate?: string;
    completedBy?: string;
    category?: string;
    navigationRoute: string;
    navigationParams?: any;
    isDeleted?: boolean;
    completionCount?: number;
    isCompletedByMe?: boolean;
}
