import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Model } from 'mongoose';
import { TasksService } from '../tasks/tasks.service';
import { FeePlansService } from '../fees/plans.service';
import { InvoicesService } from '../fees/invoices.service';
import { EnrollmentService } from '../../application/enrollment/enrollment.service';
import { 
    AdmissionCreatedEvent, 
    AdmissionStatusChangedEvent,
    AdmissionApprovedEvent,
    AdmissionRejectedEvent 
} from '../../core/events';
import { CreateAdmissionDto } from './dto/create-admission.dto';
import { UpdateAdmissionStatusDto } from './dto/update-admission-status.dto';
import { AdmissionsQueryDto } from './dto/admissions-query.dto';
import { RecentInvoicesQueryDto } from './dto/recent-invoices-query.dto';

// Enhanced status transitions with new workflow stages
const STATUS_TRANSITIONS: Record<string, string[]> = {
    inquiry: ['application', 'withdrawn'],
    application: ['under_review', 'withdrawn'],
    under_review: ['interview_scheduled', 'decision_pending', 'rejected', 'withdrawn'],
    interview_scheduled: ['decision_pending', 'withdrawn'],
    decision_pending: ['accepted', 'waitlisted', 'rejected'],
    accepted: ['enrolled', 'withdrawn'],
    waitlisted: ['accepted', 'rejected', 'withdrawn'],
    rejected: ['under_review'], // Allow reconsideration
    enrolled: ['enrolled'], // Final state
    withdrawn: ['withdrawn'], // Final state
};

@Injectable()
export class AdmissionsService {
    constructor(
        @InjectModel('Admission') private admissionModel: Model<any>,
        @InjectModel('Student') private studentModel: Model<any>,
        private readonly eventEmitter: EventEmitter2,
        private readonly enrollmentService: EnrollmentService,
        private readonly tasksService: TasksService,
        private readonly feePlansService: FeePlansService,
        private readonly invoicesService: InvoicesService,
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
            status: 'inquiry', // Start with inquiry stage
            statusHistory: [
                {
                    from: 'inquiry',
                    to: 'inquiry',
                    changedAt: now,
                    changedBy: dto.tenantId || 'system',
                },
            ],
            statusUpdatedAt: now,
        });
        const saved = await created.save();

        // Emit admission created event
        const event = new AdmissionCreatedEvent(
            { tenantId: dto.tenantId },
            {
                admissionId: saved._id.toString(),
                applicantName: dto.applicantName,
                gradeApplying: dto.gradeApplying,
                email: dto.email,
                phone: dto.phone,
            }
        );
        this.eventEmitter.emit(event.eventType, event);

        return saved;
    }

    async getPipeline(query: AdmissionsQueryDto = {}) {
        const admissions = await this.findAll(query);
        const labels: { label: string; key: string }[] = [
            { label: 'Inquiry', key: 'inquiry' },
            { label: 'Application', key: 'application' },
            { label: 'Under Review', key: 'under_review' },
            { label: 'Interview Scheduled', key: 'interview_scheduled' },
            { label: 'Decision Pending', key: 'decision_pending' },
            { label: 'Accepted', key: 'accepted' },
            { label: 'Waitlisted', key: 'waitlisted' },
            { label: 'Rejected', key: 'rejected' },
            { label: 'Enrolled', key: 'enrolled' },
            { label: 'Withdrawn', key: 'withdrawn' },
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

    async recentInvoices(query: RecentInvoicesQueryDto) {
        const limit = query.limit ?? 5;
        return this.invoicesService.findRecent(limit, query.tenantId);
    }

    async updateStatus(id: string, dto: UpdateAdmissionStatusDto, actor: string) {
        const admission = await this.admissionModel.findById(id);
        if (!admission || (dto.tenantId && admission.tenantId !== dto.tenantId)) {
            throw new NotFoundException('Admission not found');
        }

        const allowed = STATUS_TRANSITIONS[admission.status] || [];
        if (!allowed.includes(dto.status)) {
            throw new BadRequestException(
                `Invalid status transition from '${admission.status}' to '${dto.status}'`
            );
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

        // Emit status changed event
        const statusEvent = new AdmissionStatusChangedEvent(
            { tenantId: admission.tenantId, userId: actor },
            {
                admissionId: admission._id.toString(),
                previousStatus,
                newStatus: dto.status,
                applicantName: admission.applicantName,
                gradeApplying: admission.gradeApplying,
                email: admission.email,
                phone: admission.phone,
                note: dto.note,
            }
        );
        this.eventEmitter.emit(statusEvent.eventType, statusEvent);

        // Emit specific events for key transitions
        if (dto.status === 'accepted' && previousStatus !== 'accepted') {
            const approvedEvent = new AdmissionApprovedEvent(
                { tenantId: admission.tenantId, userId: actor },
                {
                    admissionId: admission._id.toString(),
                    applicantName: admission.applicantName,
                    gradeApplying: admission.gradeApplying,
                    email: admission.email,
                }
            );
            this.eventEmitter.emit(approvedEvent.eventType, approvedEvent);
        }

        if (dto.status === 'rejected' && previousStatus !== 'rejected') {
            const rejectedEvent = new AdmissionRejectedEvent(
                { tenantId: admission.tenantId, userId: actor },
                {
                    admissionId: admission._id.toString(),
                    applicantName: admission.applicantName,
                    email: admission.email,
                    reason: dto.note,
                }
            );
            this.eventEmitter.emit(rejectedEvent.eventType, rejectedEvent);
        }

        // Use EnrollmentService for one-click enrollment
        if (dto.status === 'enrolled' && previousStatus !== 'enrolled') {
            const result = await this.enrollmentService.enrollStudent({
                admissionId: admission._id.toString(),
                tenantId: admission.tenantId,
                userId: actor,
            });

            if (!result.success) {
                throw new BadRequestException(
                    `Enrollment failed: ${result.errors?.join(', ')}`
                );
            }
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
        const reference = `ADM-${admission.id || admission._id}`;
        const existingInvoice = await this.invoicesService.findByReference(reference, admission.tenantId);
        if (existingInvoice) return existingInvoice;

        const plans = await this.feePlansService.findAll({ tenantId: admission.tenantId });
        const defaultPlan = plans[0];
        if (!defaultPlan) return null;

        const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        return this.invoicesService.create({
            tenantId: admission.tenantId,
            studentId: student.id || student._id,
            studentName: admission.applicantName,
            planId: defaultPlan._id?.toString(),
            planName: defaultPlan.name,
            dueDate: dueDate.toISOString(),
            amount: defaultPlan.amount,
            currency: defaultPlan.currency,
            reference,
            notes: 'Auto-generated from admission enrollment',
        });
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
