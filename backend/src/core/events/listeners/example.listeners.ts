import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { StudentEnrolledEvent, AdmissionStatusChangedEvent } from '../index';

/**
 * Example event listener for Finance module
 * Demonstrates how modules can react to domain events
 */
@Injectable()
export class FinanceEventListeners {
    private readonly logger = new Logger(FinanceEventListeners.name);

    /**
     * When a student is enrolled, automatically create default fee assignment
     */
    @OnEvent('student.enrolled')
    async handleStudentEnrolled(event: StudentEnrolledEvent) {
        this.logger.log(`Handling student.enrolled event for student ${event.payload.studentId}`);
        
        try {
            // TODO: Implement logic to:
            // 1. Fetch default fee plan for the grade level
            // 2. Create fee assignment for the student
            // 3. Generate initial invoice with payment terms
            
            this.logger.log(`Fee assignment created for student ${event.payload.studentId}`);
        } catch (error) {
            this.logger.error(`Failed to create fee assignment: ${error.message}`, error.stack);
            // Note: Event handlers should not throw errors to prevent blocking other listeners
        }
    }

    /**
     * When admission is approved, can trigger other actions
     */
    @OnEvent('admission.approved')
    async handleAdmissionApproved(event: any) {
        this.logger.log(`Admission approved: ${event.payload.admissionId}`);
        
        // TODO: Could trigger:
        // - Welcome email with payment instructions
        // - Create pending payment record
        // - Reserve spot in fee collection system
    }
}

/**
 * Example event listener for Users module
 * Creates user accounts when students are enrolled
 */
@Injectable()
export class UsersEventListeners {
    private readonly logger = new Logger(UsersEventListeners.name);

    @OnEvent('student.enrolled')
    async handleStudentEnrolled(event: StudentEnrolledEvent) {
        this.logger.log(`Creating user accounts for student ${event.payload.studentId}`);
        
        try {
            // TODO: Implement logic to:
            // 1. Create student portal user account
            // 2. Create parent portal accounts for guardians
            // 3. Send welcome emails with login credentials
            
            this.logger.log(`User accounts created for student ${event.payload.studentId}`);
        } catch (error) {
            this.logger.error(`Failed to create user accounts: ${error.message}`, error.stack);
        }
    }
}

/**
 * Example event listener for Communications module
 * Sends notifications when admission status changes
 */
@Injectable()
export class CommunicationsEventListeners {
    private readonly logger = new Logger(CommunicationsEventListeners.name);

    @OnEvent('admission.status.changed')
    async handleStatusChanged(event: AdmissionStatusChangedEvent) {
        this.logger.log(
            `Admission status changed: ${event.payload.admissionId} ` +
            `from ${event.payload.previousStatus} to ${event.payload.newStatus}`
        );
        
        try {
            // TODO: Implement logic to:
            // 1. Select appropriate email/SMS template for new status
            // 2. Populate template with admission data
            // 3. Send notification to applicant email/phone
            
            this.logger.log(`Notification sent for admission ${event.payload.admissionId}`);
        } catch (error) {
            this.logger.error(`Failed to send notification: ${error.message}`, error.stack);
        }
    }

    @OnEvent('student.enrolled')
    async handleStudentEnrolled(event: StudentEnrolledEvent) {
        this.logger.log(`Sending welcome communications for student ${event.payload.studentId}`);
        
        try {
            // TODO: Send:
            // - Welcome email to student/parents
            // - Orientation schedule
            // - Important dates and documents needed
            
            this.logger.log(`Welcome communications sent`);
        } catch (error) {
            this.logger.error(`Failed to send welcome communications: ${error.message}`, error.stack);
        }
    }
}
