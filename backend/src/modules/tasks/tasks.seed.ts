import { Model } from 'mongoose';
import { TaskStatus, TaskPriority, AssignmentType } from './types';

const seeds = [
    {
        title: 'Submit Daily Attendance for Grade 7A',
        description: 'Mark today\'s attendance for Grade 7A by 3 PM.',
        taskType: 'SystemGenerated',
        status: 'Pending' as TaskStatus,
        priority: 'High' as TaskPriority,
        assignmentType: 'Role' as AssignmentType,
        assignedToRole: 'Teacher',
        createdBy: 'system',
        dueDate: new Date(Date.now() + 6 * 60 * 60 * 1000),
        category: 'Attendance',
        navigationRoute: '/attendance/submit',
        navigationParams: { classId: '7A', date: new Date().toISOString().slice(0, 10) },
        systemTaskKey: `ATT-${new Date().toISOString().slice(0, 10)}-7A`,
    },
    {
        title: 'Review Admissions: New Applications',
        description: 'Review pending admissions applications and move to In Review.',
        taskType: 'SystemGenerated',
        status: 'Pending' as TaskStatus,
        priority: 'Medium' as TaskPriority,
        assignmentType: 'Role' as AssignmentType,
        assignedToRole: 'Admissions',
        createdBy: 'system',
        category: 'Administrative',
        navigationRoute: '/admissions',
    },
    {
        title: 'Finalize Gradebook for Math - Grade 8B',
        description: 'Enter missing grades and finalize the gradebook for Math 8B.',
        taskType: 'Manual',
        status: 'InProgress' as TaskStatus,
        priority: 'High' as TaskPriority,
        assignmentType: 'User' as AssignmentType,
        assignedToUserId: 'teacher-123',
        createdBy: 'principal-1',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        category: 'Grading',
        navigationRoute: '/academics/gradebook',
        navigationParams: { classId: '8B', subject: 'Math' },
    },
    {
        title: 'Send Fee Reminders',
        description: 'Send reminders to parents with invoices overdue by 3+ days.',
        taskType: 'SystemGenerated',
        status: 'Pending' as TaskStatus,
        priority: 'Urgent' as TaskPriority,
        assignmentType: 'Role' as AssignmentType,
        assignedToRole: 'Finance',
        createdBy: 'system',
        category: 'Finance',
        navigationRoute: '/fees/invoices',
    },
    {
        title: 'Publish Report Cards - Term 1',
        description: 'Publish report cards for Term 1 to student/parent portals.',
        taskType: 'Manual',
        status: 'Pending' as TaskStatus,
        priority: 'High' as TaskPriority,
        assignmentType: 'Role' as AssignmentType,
        assignedToRole: 'Academics',
        createdBy: 'principal-1',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        category: 'Grading',
        navigationRoute: '/reports/publish',
    }
];

export async function seedTasks(taskModel: Model<any>) {
    const count = await taskModel.countDocuments();
    if (count > 0) {
        return;
    }
    await taskModel.insertMany(seeds);
}
