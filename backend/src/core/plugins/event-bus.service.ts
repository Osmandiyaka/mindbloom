import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * Event Bus Service - Enables inter-plugin communication via pub/sub
 * 
 * All events are tenant-isolated to prevent data leakage between tenants.
 * Plugins can publish and subscribe to events to react to platform changes.
 * 
 * Example:
 * - Student created → SMS plugin sends welcome message
 * - Payment received → Accounting plugin updates ledger
 * - Attendance marked → Parent notification plugin sends alert
 */
@Injectable()
export class EventBus {
    constructor(private readonly eventEmitter: EventEmitter2) { }

    /**
     * Publish an event
     * Events are automatically prefixed with tenantId for isolation
     * 
     * @param event Event name (e.g., 'student.created', 'payment.received')
     * @param payload Event data
     * @param tenantId Tenant ID for isolation
     */
    publish(event: string, payload: any, tenantId: string): void {
        const tenantedEvent = this.getTenantedEvent(event, tenantId);
        this.eventEmitter.emit(tenantedEvent, payload);
    }

    /**
     * Subscribe to an event
     * Only receives events for the specified tenant
     * 
     * @param event Event name to subscribe to
     * @param tenantId Tenant ID for isolation
     * @param handler Callback function to handle the event
     * @returns Unsubscribe function
     */
    subscribe(
        event: string,
        tenantId: string,
        handler: (payload: any) => void | Promise<void>,
    ): () => void {
        const tenantedEvent = this.getTenantedEvent(event, tenantId);
        this.eventEmitter.on(tenantedEvent, handler);

        // Return unsubscribe function
        return () => {
            this.eventEmitter.off(tenantedEvent, handler);
        };
    }

    /**
     * Subscribe to an event once (auto-unsubscribe after first trigger)
     * 
     * @param event Event name
     * @param tenantId Tenant ID
     * @param handler Callback function
     */
    subscribeOnce(
        event: string,
        tenantId: string,
        handler: (payload: any) => void | Promise<void>,
    ): void {
        const tenantedEvent = this.getTenantedEvent(event, tenantId);
        this.eventEmitter.once(tenantedEvent, handler);
    }

    /**
     * Unsubscribe all listeners for an event
     * 
     * @param event Event name
     * @param tenantId Tenant ID
     */
    unsubscribe(event: string, tenantId: string): void {
        const tenantedEvent = this.getTenantedEvent(event, tenantId);
        this.eventEmitter.removeAllListeners(tenantedEvent);
    }

    /**
     * Unsubscribe all listeners for an event (alias for backward compatibility)
     * 
     * @param event Event name
     * @param tenantId Tenant ID
     */
    unsubscribeAll(event: string, tenantId: string): void {
        this.unsubscribe(event, tenantId);
    }

    /**
     * Get tenant-scoped event name
     * Format: {tenantId}.{event}
     * Example: greenfield.student.created
     */
    private getTenantedEvent(event: string, tenantId: string): string {
        return `${tenantId}.${event}`;
    }
}

/**
 * Standard Platform Events
 * These are events emitted by the core platform that plugins can listen to
 */
export enum PlatformEvent {
    // Student events
    STUDENT_CREATED = 'student.created',
    STUDENT_UPDATED = 'student.updated',
    STUDENT_DELETED = 'student.deleted',
    STUDENT_ENROLLED = 'student.enrolled',

    // Attendance events
    ATTENDANCE_MARKED = 'attendance.marked',
    STUDENT_ABSENT = 'student.absent',
    STUDENT_LATE = 'student.late',

    // Fee events
    FEE_INVOICE_CREATED = 'fee.invoice.created',
    PAYMENT_RECEIVED = 'payment.received',
    PAYMENT_FAILED = 'payment.failed',
    FEE_OVERDUE = 'fee.overdue',

    // Academic events
    EXAM_CREATED = 'exam.created',
    GRADE_SUBMITTED = 'grade.submitted',
    REPORT_CARD_GENERATED = 'reportcard.generated',

    // User events
    USER_CREATED = 'user.created',
    USER_LOGIN = 'user.login',
    USER_LOGOUT = 'user.logout',

    // System events
    TENANT_CREATED = 'tenant.created',
    PLUGIN_INSTALLED = 'plugin.installed',
    PLUGIN_ENABLED = 'plugin.enabled',
    PLUGIN_DISABLED = 'plugin.disabled',

    // Limit events
    TENANT_LIMIT_THRESHOLD_REACHED = 'tenant.limit.threshold',

    // Subscription events
    SUBSCRIPTION_STATE_CHANGED = 'subscription.state.changed',
    SUBSCRIPTION_PAYMENT_SUCCEEDED = 'subscription.payment.succeeded',
    SUBSCRIPTION_PAYMENT_FAILED = 'subscription.payment.failed',
    TENANT_SUSPENDED = 'tenant.subscription.suspended',
    TENANT_DEACTIVATED = 'tenant.subscription.deactivated',
    TENANT_REACTIVATED = 'tenant.subscription.reactivated',
}
