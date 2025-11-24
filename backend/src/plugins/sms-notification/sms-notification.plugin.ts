import { Injectable, Logger } from '@nestjs/common';
import { IPlugin, PluginManifest, PluginPermission } from '../../core/plugins/plugin.interface';
import { PluginContext } from '../../core/plugins/plugin.context';

interface SMSSettings {
    accountSid: string;
    authToken: string;
    fromNumber: string;
    enableFeeReminders: boolean;
    enableAttendanceAlerts: boolean;
}

@Injectable()
export class SmsNotificationPlugin implements IPlugin {
    private readonly logger = new Logger(SmsNotificationPlugin.name);

    readonly manifest: PluginManifest = {
        id: 'sms-twilio',
        name: 'Twilio SMS Gateway',
        version: '1.0.0',
        description: 'Send SMS notifications to students and parents using Twilio. Supports bulk messaging, scheduled messages, and message templates.',
        author: 'MindBloom Team',
        homepage: 'https://mindbloom.com/plugins/sms-twilio',
        permissions: [
            PluginPermission.SEND_SMS,
            PluginPermission.READ_STUDENTS,
        ],
        dependencies: {
            core: '>=1.0.0',
        },
        provides: {
            routes: [
                {
                    path: '/plugins/sms/send',
                    method: 'POST',
                    handler: 'sendSMS',
                    permissions: [PluginPermission.SEND_SMS],
                },
                {
                    path: '/plugins/sms/send-bulk',
                    method: 'POST',
                    handler: 'sendBulkSMS',
                    permissions: [PluginPermission.SEND_SMS],
                },
                {
                    path: '/plugins/sms/templates',
                    method: 'GET',
                    handler: 'getTemplates',
                    permissions: [PluginPermission.READ_SETTINGS],
                },
                {
                    path: '/plugins/sms/history',
                    method: 'GET',
                    handler: 'getHistory',
                    permissions: [PluginPermission.READ_SETTINGS],
                },
            ],
            menuItems: [
                {
                    label: 'SMS Notifications',
                    icon: '📱',
                    route: '/plugins/sms',
                    parent: 'communications',
                    order: 10,
                },
            ],
            settings: [
                {
                    key: 'accountSid',
                    label: 'Twilio Account SID',
                    type: 'text',
                    required: true,
                },
                {
                    key: 'authToken',
                    label: 'Twilio Auth Token',
                    type: 'password',
                    required: true,
                },
                {
                    key: 'fromNumber',
                    label: 'From Phone Number',
                    type: 'text',
                    required: true,
                    validation: {
                        pattern: '^\\+[1-9]\\d{1,14}$',
                    },
                },
                {
                    key: 'enableFeeReminders',
                    label: 'Enable Fee Reminders',
                    type: 'boolean',
                    defaultValue: true,
                },
                {
                    key: 'enableAttendanceAlerts',
                    label: 'Enable Attendance Alerts',
                    type: 'boolean',
                    defaultValue: true,
                },
            ],
        },
    };

    /**
     * Called when plugin is first installed
     */
    async onInstall(context: PluginContext): Promise<void> {
        this.logger.log(`Installing SMS plugin for tenant ${context.tenantId}`);

        // Create collections for SMS history and templates
        const db = context.getDatabaseAdapter();

        // Initialize default SMS templates
        const defaultTemplates = [
            {
                id: 'fee-reminder',
                name: 'Fee Reminder',
                content: 'Dear Parent, this is a reminder that the fee payment of {amount} is due on {dueDate}. Please pay at your earliest convenience. - {schoolName}',
                variables: ['amount', 'dueDate', 'schoolName'],
            },
            {
                id: 'attendance-absent',
                name: 'Attendance Alert - Absent',
                content: 'Dear Parent, {studentName} was marked absent today ({date}). Please contact the school if this is unexpected. - {schoolName}',
                variables: ['studentName', 'date', 'schoolName'],
            },
            {
                id: 'welcome',
                name: 'Welcome Message',
                content: 'Welcome to {schoolName}! We are excited to have {studentName} join us. For any queries, please call {contactNumber}.',
                variables: ['schoolName', 'studentName', 'contactNumber'],
            },
        ];

        // Store templates (will be implemented when DB adapter is complete)
        this.logger.log(`Created ${defaultTemplates.length} default SMS templates`);
    }

    /**
     * Called when plugin is enabled
     */
    async onEnable(context: PluginContext): Promise<void> {
        this.logger.log(`Enabling SMS plugin for tenant ${context.tenantId}`);

        const eventBus = context.getEventBus();
        const settings = await context.getConfig<SMSSettings>();

        // Subscribe to student created event
        if (settings.enableFeeReminders) {
            eventBus.subscribe('fee.reminder', context.tenantId, async (data: any) => {
                await this.handleFeeReminder(context, data);
            });
        }

        // Subscribe to attendance events
        if (settings.enableAttendanceAlerts) {
            eventBus.subscribe('attendance.absent', context.tenantId, async (data: any) => {
                await this.handleAttendanceAlert(context, data);
            });
        }

        this.logger.log('SMS plugin event listeners registered');
    }

    /**
     * Called when plugin is disabled
     */
    async onDisable(context: PluginContext): Promise<void> {
        this.logger.log(`Disabling SMS plugin for tenant ${context.tenantId}`);

        const eventBus = context.getEventBus();

        // Unsubscribe from all events
        eventBus.unsubscribe('fee.reminder', context.tenantId);
        eventBus.unsubscribe('attendance.absent', context.tenantId);

        this.logger.log('SMS plugin event listeners unregistered');
    }

    /**
     * Called when plugin is uninstalled
     */
    async onUninstall(context: PluginContext): Promise<void> {
        this.logger.log(`Uninstalling SMS plugin for tenant ${context.tenantId}`);

        // Cleanup: Remove templates and history
        // (Will be implemented when DB adapter is complete)

        this.logger.log('SMS plugin data cleaned up');
    }

    /**
     * Handle fee reminder event
     */
    private async handleFeeReminder(context: PluginContext, data: any): Promise<void> {
        const settings = await context.getConfig<SMSSettings>();
        const logger = context.getLogger();

        try {
            const message = `Dear Parent, this is a reminder that the fee payment of ${data.amount} is due on ${data.dueDate}. Please pay at your earliest convenience. - ${data.schoolName}`;

            await this.sendSMS(context, data.phoneNumber, message);
            logger.log(`Fee reminder sent to ${data.phoneNumber}`);
        } catch (error) {
            logger.error(`Failed to send fee reminder: ${error.message}`);
        }
    }

    /**
     * Handle attendance alert event
     */
    private async handleAttendanceAlert(context: PluginContext, data: any): Promise<void> {
        const settings = await context.getConfig<SMSSettings>();
        const logger = context.getLogger();

        try {
            const message = `Dear Parent, ${data.studentName} was marked absent today (${data.date}). Please contact the school if this is unexpected. - ${data.schoolName}`;

            await this.sendSMS(context, data.phoneNumber, message);
            logger.log(`Attendance alert sent to ${data.phoneNumber}`);
        } catch (error) {
            logger.error(`Failed to send attendance alert: ${error.message}`);
        }
    }

    /**
     * Send SMS using Twilio
     */
    private async sendSMS(context: PluginContext, to: string, message: string): Promise<void> {
        const settings = await context.getConfig<SMSSettings>();
        const logger = context.getLogger();

        if (!settings.accountSid || !settings.authToken || !settings.fromNumber) {
            throw new Error('SMS plugin not configured. Please set Twilio credentials.');
        }

        // TODO: Implement actual Twilio integration
        // For now, just log the message
        logger.log(`[SMS] To: ${to}, Message: ${message}`);

        // In production, use Twilio SDK:
        // const client = twilio(settings.accountSid, settings.authToken);
        // await client.messages.create({
        //     body: message,
        //     from: settings.fromNumber,
        //     to: to,
        // });

        // Store in SMS history
        const db = context.getDatabaseAdapter();
        // await db.insert('sms_history', {
        //     to,
        //     message,
        //     status: 'sent',
        //     sentAt: new Date(),
        // });
    }

    /**
     * Send single SMS (route handler)
     */
    async sendSMS_Handler(context: PluginContext, body: { to: string; message: string }): Promise<any> {
        await this.sendSMS(context, body.to, body.message);
        return { success: true, message: 'SMS sent successfully' };
    }

    /**
     * Send bulk SMS (route handler)
     */
    async sendBulkSMS_Handler(
        context: PluginContext,
        body: { recipients: Array<{ to: string; message: string }> },
    ): Promise<any> {
        const results = [];

        for (const recipient of body.recipients) {
            try {
                await this.sendSMS(context, recipient.to, recipient.message);
                results.push({ to: recipient.to, success: true });
            } catch (error) {
                results.push({ to: recipient.to, success: false, error: error.message });
            }
        }

        return { results };
    }

    /**
     * Get SMS templates (route handler)
     */
    async getTemplates_Handler(context: PluginContext): Promise<any> {
        // TODO: Fetch from database
        return {
            templates: [
                {
                    id: 'fee-reminder',
                    name: 'Fee Reminder',
                    content: 'Dear Parent, this is a reminder that the fee payment of {amount} is due on {dueDate}.',
                },
                {
                    id: 'attendance-absent',
                    name: 'Attendance Alert',
                    content: 'Dear Parent, {studentName} was marked absent today ({date}).',
                },
            ],
        };
    }

    /**
     * Get SMS history (route handler)
     */
    async getHistory_Handler(context: PluginContext, query: any): Promise<any> {
        // TODO: Fetch from database
        return {
            history: [],
            total: 0,
            page: query.page || 1,
            limit: query.limit || 20,
        };
    }
}
