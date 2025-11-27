import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Model, ClientSession } from 'mongoose';
import { StudentEnrolledEvent } from '../../core/events';

export interface EnrollStudentPayload {
    admissionId: string;
    tenantId: string;
    userId: string; // User performing the enrollment
    classId?: string; // Optional: specific class assignment
    sectionId?: string; // Optional: specific section
}

export interface EnrollmentResult {
    success: boolean;
    studentId?: string;
    errors?: string[];
}

@Injectable()
export class EnrollmentService {
    private readonly logger = new Logger(EnrollmentService.name);

    constructor(
        @InjectModel('Admission') private admissionModel: Model<any>,
        @InjectModel('Student') private studentModel: Model<any>,
        private eventEmitter: EventEmitter2,
    ) { }

    /**
     * One-click enrollment: Creates student from accepted admission
     * This is a saga-like orchestration that:
     * 1. Validates admission status
     * 2. Creates student record
     * 3. Updates admission with student reference
     * 4. Emits events for other modules to react
     * All within a database transaction for atomicity
     */
    async enrollStudent(payload: EnrollStudentPayload): Promise<EnrollmentResult> {
        const { admissionId, tenantId, userId } = payload;

        this.logger.log(`Starting enrollment for admission ${admissionId}`);

        // Start a database session for transaction
        const session: ClientSession = await this.admissionModel.db.startSession();
        session.startTransaction();

        try {
            // 1. Fetch and validate admission
            const admission = await this.admissionModel
                .findOne({ _id: admissionId, tenantId })
                .session(session);

            if (!admission) {
                throw new BadRequestException('Admission not found');
            }

            if (admission.status !== 'accepted') {
                throw new BadRequestException(
                    `Cannot enroll student with status: ${admission.status}. Must be 'accepted'.`
                );
            }

            if (admission.studentId) {
                throw new BadRequestException(
                    'Student already enrolled from this admission'
                );
            }

            // 2. Create student record from admission data
            const studentData = this.mapAdmissionToStudent(admission, payload);
            const student = new this.studentModel(studentData);
            await student.save({ session });

            this.logger.log(`Created student ${student._id} from admission ${admissionId}`);

            // 3. Update admission with student reference and status
            admission.studentId = student._id;
            admission.status = 'enrolled';
            admission.statusUpdatedAt = new Date();
            admission.statusHistory.push({
                from: 'accepted',
                to: 'enrolled',
                changedBy: userId,
                changedAt: new Date(),
                note: 'Student enrolled successfully',
            });
            await admission.save({ session });

            // 4. Commit transaction
            await session.commitTransaction();

            this.logger.log(`Successfully enrolled student ${student._id}`);

            // 5. Emit event for other modules to react
            // This happens AFTER transaction commit to ensure consistency
            this.emitEnrollmentEvent(student, admission, tenantId, userId);

            return {
                success: true,
                studentId: student._id.toString(),
            };

        } catch (error) {
            // Rollback transaction on any error
            await session.abortTransaction();
            this.logger.error(`Enrollment failed for admission ${admissionId}:`, error);

            return {
                success: false,
                errors: [error.message || 'Enrollment failed'],
            };
        } finally {
            session.endSession();
        }
    }

    /**
     * Map admission data to student entity
     */
    private mapAdmissionToStudent(admission: any, payload: EnrollStudentPayload): any {
        // Parse name (simple split - can be enhanced)
        const nameParts = admission.applicantName.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
        const middleName = nameParts.length > 2
            ? nameParts.slice(1, nameParts.length - 1).join(' ')
            : undefined;

        // Generate admission number (simple implementation - enhance as needed)
        const admissionNumber = `ADM${new Date().getFullYear()}${String(Date.now()).slice(-6)}`;

        return {
            tenantId: payload.tenantId,
            admissionId: admission._id.toString(),

            // Personal Information
            firstName,
            lastName,
            middleName,
            dateOfBirth: admission.dateOfBirth,
            email: admission.email,
            phone: admission.phone,

            // Enrollment Information
            enrollment: {
                admissionNumber,
                admissionDate: new Date(),
                academicYear: new Date().getFullYear().toString(),
                class: admission.gradeApplying,
                section: payload.sectionId,
                previousSchool: admission.previousSchool,
            },

            // Status
            status: 'active',

            // Documents from admission
            documents: admission.documents?.map((doc: any) => ({
                ...doc,
                id: doc._id?.toString() || String(Date.now()),
            })) || [],
        };
    }

    /**
     * Emit StudentEnrolled event for other modules to handle
     */
    private emitEnrollmentEvent(
        student: any,
        admission: any,
        tenantId: string,
        userId: string
    ): void {
        const event = new StudentEnrolledEvent(
            { tenantId, userId },
            {
                studentId: student._id.toString(),
                admissionId: admission._id.toString(),
                gradeLevel: admission.gradeApplying,
                firstName: student.firstName,
                lastName: student.lastName,
                email: student.email,
                guardians: student.guardians || [],
            }
        );

        this.eventEmitter.emit(event.eventType, event);
        this.logger.log(`Emitted ${event.eventType} event for student ${student._id}`);
    }
}
