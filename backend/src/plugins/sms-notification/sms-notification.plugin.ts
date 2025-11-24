import { Injectable } from '@nestjs/common';
import { IPlugin, PluginManifest, PluginPermission } from '../../core/plugins/plugin.interface';
import { PluginContext } from '../../core/plugins/plugin.context';

/**
 * Simple SMS Notification Plugin
 * Demonstrates a basic plugin that extends communication functionality
 */
@Injectable()
export class SmsNotificationPlugin implements IPlugin {
    readonly manifest: PluginManifest = {
        id: 'sms-notifications',
        name: 'SMS Notifications',
        version: '1.0.0',
        description: 'Send SMS notifications to students and parents',
        author: 'MindBloom Team',
        homepage: 'https://mindbloom.io/plugins/sms-notifications',
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
                    handler: 'sendSms',
                    permissions: [PluginPermission.SEND_SMS],
                },
                {
                    path: '/plugins/sms/templates',
                    method: 'GET',
                    handler: 'getTemplates',
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
                    key: 'apiKey',
                    label: 'SMS Gateway API Key',
                    type: 'password',
                    required: true,
                },
                {
                    key: 'senderId',
                    label: 'Sender ID',
                    type: 'text',
                    required: true,
                },
                {
                    key: 'enableScheduling',
                    label: 'Enable Scheduled Messages',
                    type: 'boolean',
                    defaultValue: true,
                },
            ],
        },
    };

    async onInstall(context: PluginContext): Promise<void> {
        context.logger.log('Installing SMS Notification Plugin...');

        // Create default message templates
        const defaultTemplates = [
            {
                name: 'Fee Reminder',
                content: 'Dear {parent_name}, this is a reminder that {student_name}\'s fees are due on {due_date}.',
            },
            {
                name: 'Attendance Alert',
                content: 'Dear {parent_name}, {student_name} was absent today ({date}).',
            },
            {
                name: 'Event Notification',
                content: 'Dear {parent_name}, reminder about {event_name} on {event_date}.',
            },
        ];

        // Store templates in plugin settings
        await context.settings.set('templates', defaultTemplates);

        context.logger.log('SMS Notification Plugin installed successfully');
    }

    async onEnable(context: PluginContext): Promise<void> {
        context.logger.log('Enabling SMS Notification Plugin...');

        // Register event listeners
        context.eventBus.on('fee.overdue', async (data) => {
            await this.sendFeeReminder(context, data);
        });

        context.eventBus.on('student.absent', async (data) => {
            await this.sendAbsenceAlert(context, data);
        });

        context.logger.log('SMS Notification Plugin enabled');
    }

    async onDisable(context: PluginContext): Promise<void> {
        context.logger.log('Disabling SMS Notification Plugin...');

        // Unregister event listeners
        context.eventBus.off('fee.overdue');
        context.eventBus.off('student.absent');

        context.logger.log('SMS Notification Plugin disabled');
    }

    async onUninstall(context: PluginContext): Promise<void> {
        context.logger.log('Uninstalling SMS Notification Plugin...');

        // Clean up plugin data
        await context.settings.clear();

        context.logger.log('SMS Notification Plugin uninstalled');
    }

    // Plugin-specific methods

    private async sendFeeReminder(context: PluginContext, data: any): Promise<void> {
        const apiKey = await context.settings.get('apiKey');
        const senderId = await context.settings.get('senderId');

        if (!apiKey || !senderId) {
            context.logger.warn('SMS credentials not configured');
            return;
        }

        // Get template
        const templates = await context.settings.get('templates') || [];
        const template = templates.find((t: any) => t.name === 'Fee Reminder');

        if (!template) return;

        // Format message
        const message = template.content
            .replace('{parent_name}', data.parentName)
            .replace('{student_name}', data.studentName)
            .replace('{due_date}', data.dueDate);

        // Send SMS via gateway (simulated)
        context.logger.log(`Sending SMS to ${data.phoneNumber}: ${message}`);
        // In production: await this.smsGateway.send(data.phoneNumber, message);
    }

    private async sendAbsenceAlert(context: PluginContext, data: any): Promise<void> {
        const apiKey = await context.settings.get('apiKey');

        if (!apiKey) {
            context.logger.warn('SMS credentials not configured');
            return;
        }

        const templates = await context.settings.get('templates') || [];
        const template = templates.find((t: any) => t.name === 'Attendance Alert');

        if (!template) return;

        const message = template.content
            .replace('{parent_name}', data.parentName)
            .replace('{student_name}', data.studentName)
            .replace('{date}', data.date);

        context.logger.log(`Sending absence alert to ${data.phoneNumber}: ${message}`);
    }

    // Route handlers

    async sendSms(context: PluginContext, payload: any): Promise<any> {
        const { phoneNumbers, message, scheduled } = payload;

        const apiKey = await context.settings.get('apiKey');
        if (!apiKey) {
            throw new Error('SMS gateway not configured');
        }

        // Validate permissions
        if (!context.hasPermission(PluginPermission.SEND_SMS)) {
            throw new Error('Insufficient permissions');
        }

        context.logger.log(`Sending SMS to ${phoneNumbers.length} recipients`);

        // In production: send actual SMS
        return {
            success: true,
            sent: phoneNumbers.length,
            scheduled: scheduled || false,
        };
    }

    async getTemplates(context: PluginContext): Promise<any[]> {
        return await context.settings.get('templates') || [];
    }
}
