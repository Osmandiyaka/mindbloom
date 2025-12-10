import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TasksService } from '../tasks/tasks.service';
import { CreateAdmissionDto } from './dto/create-admission.dto';
import { UpdateAdmissionStatusDto } from './dto/update-admission-status.dto';
import { AdmissionsQueryDto } from './dto/admissions-query.dto';

const STATUS_TRANSITIONS: Record<string, string[]> = {
    review: ['review', 'rejected', 'enrolled'],
    rejected: ['rejected', 'review'],
    enrolled: ['enrolled'],
};

@Injectable()
export class AdmissionsService {
    constructor(
        @InjectModel('Admission') private admissionModel: Model<any>,
        @InjectModel('Student') private studentModel: Model<any>,
        private readonly tasksService: TasksService,
    ) { }

    async findAll(query: AdmissionsQueryDto = {}) {
        const filters: any = {};
        if (query.tenantId) filters.tenantId = query.tenantId;
        if (query.statuses?.length) filters.status = { $in: query.statuses };
        return this.admissionModel.find(filters).sort({ createdAt: -1 }).lean().exec();
    }

    async create(dto: CreateAdmissionDto) {
        const now = new Date();
        const created = new this.admissionModel({
            ...dto,
            statusHistory: [
                {
                    from: 'review',
                    to: 'review',
                    changedAt: now,
                    changedBy: dto.tenantId || 'system',
                },
            ],
            statusUpdatedAt: now,
        });
        return created.save();
    }

    async getPipeline(query: AdmissionsQueryDto = {}) {
        const admissions = await this.findAll(query);
        const labels: { label: string; key: string }[] = [
            { label: 'Review', key: 'review' },
            { label: 'Rejected', key: 'rejected' },
            { label: 'Enrolled', key: 'enrolled' },
        ];
        return {
            stages: labels.map(stage => ({
                status: stage.key,
                label: stage.label,
                count: admissions.filter(a => a.status === stage.key).length,
                applications: admissions.filter(a => a.status === stage.key),
            })),
        };
    }

    async updateStatus(id: string, dto: UpdateAdmissionStatusDto, actor: string) {
        const admission = await this.admissionModel.findById(id);
        if (!admission || (dto.tenantId && admission.tenantId !== dto.tenantId)) {
            throw new NotFoundException('Admission not found');
        }

        const allowed = STATUS_TRANSITIONS[admission.status] || [];
        if (!allowed.includes(dto.status)) {
            throw new BadRequestException('Invalid status transition');
        }

        const previousStatus = admission.status;
        const changedAt = new Date();
        admission.status = dto.status;
        admission.updatedAt = changedAt;
        admission.statusUpdatedAt = changedAt;
        admission.statusHistory = [
            ...(admission.statusHistory || []),
            { from: previousStatus, to: dto.status, changedAt, changedBy: actor, note: dto.note },
        ];

        await admission.save();

        if (dto.status === 'enrolled' && previousStatus !== 'enrolled') {
            await this.ensureStudentAndTask(admission, actor);
        }

        return admission.toObject();
    }

    private async ensureStudentAndTask(admission: any, actor: string) {
        const admissionKey = admission.id || admission._id;
        const existing = await this.studentModel.findOne({
            $or: [
                { admissionId: admissionKey },
                admission.email ? { email: admission.email } : null,
            ].filter(Boolean),
        });

        const student = existing || await this.studentModel.create({
            tenantId: admission.tenantId,
            admissionId: admissionKey,
            firstName: admission.applicantName,
            enrollment: { class: admission.gradeApplying },
            email: admission.email,
            phone: admission.phone,
            status: 'active',
        });

        await this.ensureInitialInvoice(admission, student);
        await this.ensureSystemTask(admission, student, actor);
    }

    private async ensureInitialInvoice(admission: any, student: any) {
        // Fees integration removed for now
        return null;
    }

    private async ensureSystemTask(admission: any, student: any, actor: string) {
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
            systemTaskKey: taskKey,
        }, actor || 'system');
    }
}
