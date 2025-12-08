import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InvitationMailer {
    private readonly logger = new Logger(InvitationMailer.name);
    private readonly from: string;
    private readonly frontendBase: string;

    constructor(private readonly configService: ConfigService) {
        this.from = this.configService.get<string>('EMAIL_FROM') || 'no-reply@mindbloom.app';
        const base = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';
        this.frontendBase = base.replace(/\/$/, '');
    }

    private buildInviteLink(token: string): string {
        return `${this.frontendBase}/auth/invite/${token}`;
    }

    async sendInvitation(to: string, token: string, roles: string[], expiresAt: Date): Promise<void> {
        const inviteLink = this.buildInviteLink(token);
        const subject = 'You have been invited to MindBloom';
        const roleList = roles.length ? roles.join(', ') : 'the assigned roles';
        const text = `You have been invited to MindBloom with ${roleList}. Use this link to join: ${inviteLink}. This link expires at ${expiresAt.toUTCString()}.`;
        const html = `
      <div style="font-family:'Inter',Arial,sans-serif; background:#0f172a; padding:24px;">
        <div style="max-width:560px; margin:0 auto; background:#111827; border-radius:14px; overflow:hidden; box-shadow:0 12px 30px rgba(0,0,0,0.35);">
          <div style="padding:24px 24px 8px; color:#e2e8f0;">
            <p style="margin:0 0 6px; font-size:12px; letter-spacing:0.14em; text-transform:uppercase; color:#94a3b8;">MindBloom</p>
            <h2 style="margin:0 0 8px; font-size:20px; color:#f8fafc;">You're invited</h2>
            <p style="margin:0 0 12px; line-height:1.6;">You've been invited to join MindBloom${roles.length ? ` with the following role(s): <strong>${roleList}</strong>` : ''}.</p>
            <p style="margin:0 0 16px; line-height:1.6;">Accept the invitation before <strong>${expiresAt.toUTCString()}</strong>.</p>
            <div style="text-align:center; margin:24px 0;">
              <a href="${inviteLink}" style="display:inline-block; padding:12px 20px; background:#22c55e; color:#0b1221; border-radius:10px; font-weight:700; text-decoration:none; box-shadow:0 10px 30px rgba(34,197,94,0.35);">
                Accept invitation
              </a>
            </div>
            <p style="margin:0 0 12px; line-height:1.6;">If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break:break-all; background:#0b1221; padding:12px; border-radius:10px; font-family:monospace; font-size:13px; color:#e2e8f0;">${inviteLink}</p>
            <p style="margin:20px 0 0; color:#94a3b8; font-size:13px;">If you weren't expecting this invite, you can ignore this email.</p>
          </div>
        </div>
      </div>
    `;

        const smtpHost = this.configService.get<string>('SMTP_URL');
        const smtpPort = Number(this.configService.get<string>('EMAIL_PORT') || 0);
        const smtpUser = this.configService.get<string>('EMAIL_USER');
        const smtpPass = this.configService.get<string>('EMAIL_PASS');

        if (smtpHost) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const nodemailer = require('nodemailer');
                const transporter = (smtpUser && smtpPass)
                    ? nodemailer.createTransport({
                        host: smtpHost,
                        port: smtpPort || 587,
                        secure: (smtpPort || 587) === 465,
                        auth: { user: smtpUser, pass: smtpPass },
                    })
                    : nodemailer.createTransport(smtpHost);

                await transporter.sendMail({
                    to,
                    from: this.from,
                    subject,
                    text,
                    html,
                });
                return;
            } catch (error) {
                this.logger.warn(`SMTP send failed, falling back to console: ${(error as Error).message}`);
            }
        }

        // Fallback: log the email content for non-SMTP environments
        this.logger.log(`Invite for ${to}: ${inviteLink}`);
        this.logger.debug(html);
    }
}
