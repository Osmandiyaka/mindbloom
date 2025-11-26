import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TasksService } from '../tasks/tasks.service';

@Injectable()
export class AdmissionsService {
    constructor(
        @InjectModel('Admission') private admissionModel: Model<any>,
        @InjectModel('Student') private studentModel: Model<any>,
        private readonly tasksService: TasksService,
    ) { }

    async findAll() {
        return this.admissionModel.find().sort({ createdAt: -1 }).lean().exec();
    }

    async create(dto: any) {
        const created = new this.admissionModel(dto);
        return created.save();
    }

    async updateStatus(id: string, status: string) {
        const updated = await this.admissionModel.findByIdAndUpdate(
            id,
            { status, updatedAt: new Date() },
            { new: true }
        );
        if (!updated) throw new NotFoundException('Admission not found');
        if (status === 'enrolled') {
            await this.ensureStudentAndTask(updated);
        }
        return updated;
    }

    private async ensureStudentAndTask(admission: any) {
        const existing = await this.studentModel.findOne({ admissionId: admission.id || admission._id });
        const student = existing || await this.studentModel.create({
            admissionId: admission.id || admission._id,
            firstName: admission.applicantName,
            enrollment: { class: admission.gradeApplying },
            email: admission.email,
            phone: admission.phone,
            status: 'active'
        });

        const taskKey = `complete-student-${student.id || student._id}`;
        const duplicate = await this.tasksService.findAll({ systemTaskKey: taskKey });
        if (duplicate && Array.isArray(duplicate) && duplicate.length > 0) return;

        await this.tasksService.create({
            title: `Complete student record: ${admission.applicantName}`,
            description: 'Finish the student profile and enrollment details.',
            priority: 'High',
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            category: 'Admissions',
            assignmentType: 'Role',
            assignedToRole: 'Admin',
            navigationRoute: `/students/${student.id || student._id}/edit`,
            navigationParams: { taskId: taskKey },
            metadata: { admissionId: admission.id || admission._id, studentId: student.id || student._id },
            systemTaskKey: taskKey
        }, 'system');
    }
}
