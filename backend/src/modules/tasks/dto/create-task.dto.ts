export class CreateTaskDto {
    title: string;
    description?: string;
    priority: 'Low' | 'Medium' | 'High' | 'Urgent';
    dueDate?: Date;
    category: string;
    assignmentType: 'User' | 'Role' | 'Broadcast';
    assignedToUserId?: string;
    assignedToRole?: string;
    navigationRoute: string;
    navigationParams?: any;
    metadata?: any;
    systemTaskKey?: string;
    recurrenceRule?: string;
}
