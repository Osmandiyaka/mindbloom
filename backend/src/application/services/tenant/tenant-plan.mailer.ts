import { Injectable } from '@nestjs/common';
import { MailService } from '../../../infrastructure/mail/mail.service';
import { TenantPlan, ResourceLimits } from '../../../domain/tenant/entities/tenant.entity';

@Injectable()
export class TenantPlanMailer {
    constructor(private readonly mailService: MailService) { }

    private formatLimit(value: number): string {
        return value === -1 ? 'Unlimited' : value.toString();
    }

    async sendPlanAssignment(to: string, schoolName: string, plan: TenantPlan, limits: ResourceLimits): Promise<void> {
        const subject = `Your MindBloom plan: ${plan}`;
        const text = [
            `Hi ${schoolName} Admin,`,
            'Your school has been provisioned on MindBloom.',
            `Plan: ${plan}`,
            'Limits:',
            `Students: ${this.formatLimit(limits.maxStudents)}`,
            `Teachers: ${this.formatLimit(limits.maxTeachers)}`,
            `Classes: ${this.formatLimit(limits.maxClasses)}`,
            `Admins: ${this.formatLimit(limits.maxAdmins)}`,
            `Storage (MB): ${this.formatLimit(limits.maxStorage)}`,
            `Bandwidth (GB/mo): ${this.formatLimit(limits.maxBandwidth)}`,
            'You can adjust these limits in the admin console if you have override permissions.',
        ].join('\n');

        const body = `
            <h2 style="margin:0 0 10px; font-size:20px; color:#f8fafc;">Welcome to MindBloom</h2>
            <p style="margin:0 0 12px; line-height:1.6;">Hi {{schoolName}} Admin, your school has been provisioned.</p>
            <p style="margin:0 0 12px; line-height:1.6;">
                <strong>Plan:</strong> {{plan}}
            </p>
            <p style="margin:0 0 8px; font-weight:600; color:#e5e7eb;">Limits</p>
            <ul style="margin:0 0 16px 18px; padding:0; color:#d1d5db; line-height:1.6;">
                <li>Students: {{limits.maxStudents}}</li>
                <li>Teachers: {{limits.maxTeachers}}</li>
                <li>Classes: {{limits.maxClasses}}</li>
                <li>Admins: {{limits.maxAdmins}}</li>
                <li>Storage (MB): {{limits.maxStorage}}</li>
                <li>Bandwidth (GB/mo): {{limits.maxBandwidth}}</li>
            </ul>
            <p style="margin:12px 0 0; line-height:1.6;">You can adjust these limits in the admin console if you have override permissions.</p>
        `;

        await this.mailService.send({
            to,
            subject,
            text,
            template: {
                body,
                context: {
                    schoolName,
                    plan,
                    limits: {
                        maxStudents: this.formatLimit(limits.maxStudents),
                        maxTeachers: this.formatLimit(limits.maxTeachers),
                        maxClasses: this.formatLimit(limits.maxClasses),
                        maxAdmins: this.formatLimit(limits.maxAdmins),
                        maxStorage: this.formatLimit(limits.maxStorage),
                        maxBandwidth: this.formatLimit(limits.maxBandwidth),
                    },
                },
            },
        });
    }
}
