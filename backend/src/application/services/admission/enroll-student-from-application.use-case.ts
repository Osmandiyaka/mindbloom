import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Admission, ApplicationStatus } from '../../../domain/admission/entities/admission.entity';
import { IAdmissionRepository, ADMISSION_REPOSITORY } from '../../../domain/ports/out/admission-repository.port';
import { IStudentRepository, STUDENT_REPOSITORY } from '../../../domain/ports/out/student-repository.port';
import { Student, StudentProps, StudentStatus } from '../../../domain/student/entities/student.entity';
import { TasksService } from '../../../modules/tasks/tasks.service';
import { InvoicesService } from '../../../modules/fees/invoices.service';
import { FeePlansService } from '../../../modules/fees/plans.service';

@Injectable()
export class EnrollStudentFromApplicationUseCase {
    constructor(
        @Inject(ADMISSION_REPOSITORY)
        private readonly admissionRepository: IAdmissionRepository,
        @Inject(STUDENT_REPOSITORY)
        private readonly studentRepository: IStudentRepository,
        private readonly eventEmitter: EventEmitter2,
        // Legacy integrations (TODO: refactor these to ports/interfaces later)
        private readonly tasksService: TasksService,
        private readonly invoicesService: InvoicesService,
        private readonly feePlansService: FeePlansService,
    ) {}

    async execute(applicationId: string, tenantId: string, enrolledBy: string): Promise<{ admission: Admission; student: Student }> {
        // Get the application
        const admission = await this.admissionRepository.findById(applicationId, tenantId);
        
        if (!admission) {
            throw new NotFoundException(`Application with ID ${applicationId} not found`);
        }

        // Validate can be enrolled
        if (!admission.canBeEnrolled()) {
            throw new BadRequestException(
                `Application cannot be enrolled. Current status: ${admission.status}. ` +
                `${admission.hasOfferExpired() ? 'Offer has expired.' : ''}`
            );
        }

        // Check if student already exists with this admission number
        const existingStudent = await this.studentRepository.findByAdmissionNumber(
            admission.applicationNumber!,
            tenantId,
        );

        if (existingStudent) {
            throw new BadRequestException('Student already enrolled from this application');
        }

        // Create student from admission
        const studentId = new Types.ObjectId().toString();
        const studentProps: StudentProps = {
            id: studentId,
            tenantId: admission.tenantId,
            firstName: admission.firstName,
            lastName: admission.lastName,
            middleName: admission.middleName,
            dateOfBirth: admission.dateOfBirth,
            gender: admission.gender as any,
            nationality: admission.nationality,
            religion: admission.religion,
            email: admission.email,
            phone: admission.phone,
            address: admission.address as any,
            guardians: admission.guardians as any,
            medicalInfo: admission.bloodGroup ? { bloodGroup: admission.bloodGroup as any } : undefined,
            enrollment: {
                admissionNumber: admission.applicationNumber!,
                admissionDate: new Date(),
                academicYear: admission.academicYear,
                class: admission.gradeApplying,
                previousSchool: admission.previousSchool?.schoolName,
                previousClass: admission.previousSchool?.grade,
            },
            status: StudentStatus.ACTIVE,
            documents: admission.documents?.map(doc => ({
                id: doc.id,
                name: doc.name,
                type: doc.type,
                url: doc.url,
                uploadedAt: doc.uploadedAt,
            })) || [],
            notes: admission.notes,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const student = new Student(studentProps);
        const createdStudent = await this.studentRepository.create(student);

        // Update admission status to enrolled
        const enrolledAdmission = admission.updateStatus(ApplicationStatus.ENROLLED, enrolledBy, 'Student enrolled');
        const updatedAdmission = await this.admissionRepository.update(enrolledAdmission);

        // Create initial invoice with default fee plan (migrated from old service)
        await this.ensureInitialInvoice(admission, createdStudent, tenantId);

        // Create admin task to complete student profile (migrated from old service)
        await this.ensureSystemTask(admission, createdStudent, tenantId, enrolledBy);

        // Emit event for other modules (fees, library, etc.)
        this.eventEmitter.emit('student.enrolled', {
            studentId: createdStudent.id,
            applicationId: admission.id,
            tenantId,
            gradeLevel: admission.gradeApplying,
            academicYear: admission.academicYear,
            enrolledAt: new Date(),
        });

        return {
            admission: updatedAdmission,
            student: createdStudent,
        };
    }

    /**
     * Creates initial invoice for the enrolled student using default fee plan
     * Migrated from old AdmissionsService.ensureInitialInvoice()
     */
    private async ensureInitialInvoice(admission: Admission, student: Student, tenantId: string): Promise<any> {
        const reference = `ADM-${admission.id}`;

        // Check if invoice already exists
        const existingInvoice = await this.invoicesService.findByReference(reference, tenantId);
        if (existingInvoice) return existingInvoice;

        // Get default fee plan
        const plans = await this.feePlansService.findAll({ tenantId });
        const defaultPlan = plans[0];
        if (!defaultPlan) {
            console.warn(`No fee plan found for tenant ${tenantId}. Skipping invoice creation.`);
            return null;
        }

        // Set due date to 7 days from now
        const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        // Create invoice
        return this.invoicesService.create({
            tenantId,
            studentId: student.id,
            studentName: `${admission.firstName} ${admission.lastName}`,
            planId: defaultPlan._id?.toString(),
            planName: defaultPlan.name,
            dueDate: dueDate.toISOString(),
            amount: defaultPlan.amount,
            currency: defaultPlan.currency,
            reference,
            notes: 'Auto-generated from admission enrollment',
        });
    }

    /**
     * Creates system task for admin to complete student profile
     * Migrated from old AdmissionsService.ensureSystemTask()
     */
    private async ensureSystemTask(
        admission: Admission,
        student: Student,
        tenantId: string,
        actor: string,
    ): Promise<void> {
        const taskKey = `complete-student-${student.id}`;

        // Check if task already exists
        const duplicate = await this.tasksService.findAll({ systemTaskKey: taskKey });
        if (duplicate && Array.isArray(duplicate) && duplicate.length > 0) {
            return; // Task already exists
        }

        // Create task due in 3 days
        await this.tasksService.create(
            {
                title: `Complete student record: ${admission.firstName} ${admission.lastName}`,
                description: 'Finish the student profile and enrollment details.',
                priority: 'High',
                dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                category: 'Admissions',
                assignmentType: 'Role',
                assignedToRole: 'Admin',
                navigationRoute: `/students/${student.id}/edit`,
                navigationParams: { taskId: taskKey },
                metadata: { admissionId: admission.id, studentId: student.id },
                systemTaskKey: taskKey,
            },
            actor || 'system',
        );
    }
}
