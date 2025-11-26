export class UpdateTaskDto {
    title?: string;
    description?: string;
    priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
    dueDate?: Date;
    category?: string;
    assignmentType?: 'User' | 'Role' | 'Broadcast';
    assignedToUserId?: string;
    assignedToRole?: string;
    navigationRoute?: string;
    navigationParams?: any;
    metadata?: any;
    status?: 'Pending' | 'InProgress' | 'Completed' | 'Cancelled' | 'Expired';
}
